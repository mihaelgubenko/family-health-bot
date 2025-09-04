const { getServicesKeyboard, getDaysKeyboard, getTimeKeyboard, getConfirmKeyboard, getSpecialistInlineKeyboard } = require('../keyboards');
const AppointmentService = require('../services/appointmentService');
const config = require('../config.js');
const moment = require('moment');

// Состояния пользователей для записи на прием
const appointmentStates = new Map();

class AppointmentHandler {
  
  // Показать меню записи на прием
  static async showAppointmentMenu(bot, chatId, userId) {
    const message = `
📅 *Запись на прием*

Выберите специалиста для записи на прием:

🥗 *Нутрициолог* - ${config.services.nutritionist.price}₽ (${config.services.nutritionist.duration} мин)
${config.services.nutritionist.description}

🦴 *Остеопат* - ${config.services.osteopath.price}₽ (${config.services.osteopath.duration} мин)
${config.services.osteopath.description}

💆‍♀️ *Массажист* - ${config.services.massage.price}₽ (${config.services.massage.duration} мин)
${config.services.massage.description}

🎯 *Иглорефлексотерапия* - ${config.services.acupuncture.price}₽ (${config.services.acupuncture.duration} мин)
${config.services.acupuncture.description}

⚡ *Физиотерапия* - ${config.services.physiotherapy.price}₽ (${config.services.physiotherapy.duration} мин)
${config.services.physiotherapy.description}

🔬 *Биосканирование* - ${config.services.bioscan.price}₽ (${config.services.bioscan.duration} мин)
${config.services.bioscan.description}
    `;
    
    await bot.sendMessage(chatId, message, {
      parse_mode: 'Markdown',
      reply_markup: getSpecialistInlineKeyboard()
    });
  }
  
  // Обработать выбор специалиста
  static async handleSpecialistSelection(bot, chatId, userId, specialist) {
    const serviceConfig = config.services[specialist];
    
    if (!serviceConfig) {
      await bot.sendMessage(chatId, '❌ Неизвестный специалист. Попробуйте еще раз.');
      return;
    }
    
    // Сохранить выбор специалиста в состоянии пользователя
    appointmentStates.set(userId, {
      step: 'select_date',
      service: specialist,
      serviceName: serviceConfig.name,
      price: serviceConfig.price,
      duration: serviceConfig.duration
    });
    
    const message = `
✅ Вы выбрали: *${serviceConfig.name}*

📋 Описание: ${serviceConfig.description}
⏱️ Длительность: ${serviceConfig.duration} минут
💰 Стоимость: ${serviceConfig.price} рублей

📅 Теперь выберите удобную дату:
    `;
    
    await bot.sendMessage(chatId, message, {
      parse_mode: 'Markdown',
      reply_markup: getDaysKeyboard()
    });
  }
  
  // Обработать выбор даты
  static async handleDateSelection(bot, chatId, userId, selectedDate) {
    const userState = appointmentStates.get(userId);
    
    if (!userState || userState.step !== 'select_date') {
      await bot.sendMessage(chatId, '❌ Ошибка. Пожалуйста, начните запись заново.');
      return;
    }
    
    // Парсим выбранную дату
    const date = this.parseSelectedDate(selectedDate);
    
    if (!date || !AppointmentService.isWorkingDay(date)) {
      await bot.sendMessage(chatId, '❌ Выбранный день не является рабочим. Выберите другую дату.');
      return;
    }
    
    // Получить доступные слоты времени
    try {
      const availableSlots = await AppointmentService.getAvailableSlots(userState.service, date);
      
      if (availableSlots.length === 0) {
        await bot.sendMessage(chatId, '😔 К сожалению, на выбранную дату нет свободных мест. Выберите другую дату.', {
          reply_markup: getDaysKeyboard()
        });
        return;
      }
      
      // Обновить состояние пользователя
      userState.step = 'select_time';
      userState.selectedDate = date;
      appointmentStates.set(userId, userState);
      
      const message = `
📅 Выбранная дата: *${moment(date).format('DD.MM.YYYY (dddd)')}*
👨‍⚕️ Специалист: ${userState.serviceName}

🕐 Выберите удобное время:
      `;
      
      await bot.sendMessage(chatId, message, {
        parse_mode: 'Markdown',
        reply_markup: this.createTimeKeyboard(availableSlots)
      });
      
    } catch (error) {
      console.error('Ошибка получения доступных слотов:', error);
      await bot.sendMessage(chatId, '❌ Произошла ошибка. Попробуйте позже.');
    }
  }
  
  // Обработать выбор времени
  static async handleTimeSelection(bot, chatId, userId, selectedTime) {
    const userState = appointmentStates.get(userId);
    
    if (!userState || userState.step !== 'select_time') {
      await bot.sendMessage(chatId, '❌ Ошибка. Пожалуйста, начните запись заново.');
      return;
    }
    
    // Проверить доступность выбранного времени
    try {
      const isAvailable = await AppointmentService.isTimeAvailable(userState.selectedDate, selectedTime);
      
      if (!isAvailable) {
        await bot.sendMessage(chatId, '😔 Выбранное время уже занято. Выберите другое время.');
        return;
      }
      
      // Обновить состояние
      userState.step = 'enter_contact';
      userState.selectedTime = selectedTime;
      appointmentStates.set(userId, userState);
      
      const message = `
✅ Время выбрано: *${selectedTime}*

📋 *Сводка записи:*
👨‍⚕️ Специалист: ${userState.serviceName}
📅 Дата: ${moment(userState.selectedDate).format('DD.MM.YYYY (dddd)')}
🕐 Время: ${selectedTime}
⏱️ Длительность: ${userState.duration} минут
💰 Стоимость: ${userState.price} рублей

📞 Теперь введите ваш номер телефона для связи:
(в формате +7XXXXXXXXXX)
      `;
      
      await bot.sendMessage(chatId, message, {
        parse_mode: 'Markdown'
      });
      
    } catch (error) {
      console.error('Ошибка проверки доступности времени:', error);
      await bot.sendMessage(chatId, '❌ Произошла ошибка. Попробуйте позже.');
    }
  }
  
  // Обработать ввод контактных данных
  static async handleContactInput(bot, chatId, userId, text, userInfo) {
    const userState = appointmentStates.get(userId);
    
    if (!userState || userState.step !== 'enter_contact') {
      return false; // Не наша обработка
    }
    
    // Валидация номера телефона
    const phoneRegex = /^\+7\d{10}$/;
    if (!phoneRegex.test(text)) {
      await bot.sendMessage(chatId, '❌ Неверный формат номера телефона. Введите номер в формате +7XXXXXXXXXX');
      return true;
    }
    
    // Обновить состояние
    userState.step = 'enter_notes';
    userState.phone = text;
    userState.firstName = userInfo.first_name || 'Пациент';
    userState.lastName = userInfo.last_name || '';
    appointmentStates.set(userId, userState);
    
    const message = `
📞 Номер телефона: ${text}

📝 Хотите добавить дополнительную информацию или описать жалобы? 
(например: "Боли в спине", "Проблемы с пищеварением", "Первичный прием")

Или напишите "пропустить", если дополнительной информации нет.
    `;
    
    await bot.sendMessage(chatId, message);
    return true;
  }
  
  // Обработать ввод примечаний
  static async handleNotesInput(bot, chatId, userId, text) {
    const userState = appointmentStates.get(userId);
    
    if (!userState || userState.step !== 'enter_notes') {
      return false;
    }
    
    // Сохранить примечания (если есть)
    if (text.toLowerCase() !== 'пропустить') {
      userState.notes = text;
    }
    
    // Показать финальное подтверждение
    await this.showFinalConfirmation(bot, chatId, userId, userState);
    return true;
  }
  
  // Показать финальное подтверждение
  static async showFinalConfirmation(bot, chatId, userId, userState) {
    userState.step = 'confirm';
    appointmentStates.set(userId, userState);
    
    const message = `
📋 *Подтверждение записи*

👤 Пациент: ${userState.firstName} ${userState.lastName}
📞 Телефон: ${userState.phone}

👨‍⚕️ Специалист: ${userState.serviceName}
📅 Дата: ${moment(userState.selectedDate).format('DD.MM.YYYY (dddd)')}
🕐 Время: ${userState.selectedTime}
⏱️ Длительность: ${userState.duration} минут
💰 Стоимость: ${userState.price} рублей

${userState.notes ? `📝 Примечания: ${userState.notes}` : ''}

📍 Адрес: г. Москва, ул. Здоровья, д. 123

Все данные указаны верно?
    `;
    
    await bot.sendMessage(chatId, message, {
      parse_mode: 'Markdown',
      reply_markup: getConfirmKeyboard()
    });
  }
  
  // Подтвердить запись
  static async confirmAppointment(bot, chatId, userId) {
    const userState = appointmentStates.get(userId);
    
    if (!userState || userState.step !== 'confirm') {
      await bot.sendMessage(chatId, '❌ Ошибка подтверждения. Попробуйте начать запись заново.');
      return;
    }
    
    try {
      // Создать запись в базе данных
      const appointmentData = {
        userId: userId,
        firstName: userState.firstName,
        lastName: userState.lastName,
        phone: userState.phone,
        service: userState.service,
        serviceName: userState.serviceName,
        date: userState.selectedDate,
        time: userState.selectedTime,
        duration: userState.duration,
        price: userState.price,
        notes: userState.notes || '',
        status: 'confirmed',
        bookingMethod: 'telegram'
      };
      
      const appointment = await AppointmentService.createAppointment(appointmentData);
      
      // Очистить состояние пользователя
      appointmentStates.delete(userId);
      
      const confirmMessage = `
✅ *Запись успешно создана!*

🆔 Номер записи: ${appointment._id.toString().slice(-6)}

📋 *Детали записи:*
👤 ${userState.firstName} ${userState.lastName}
📞 ${userState.phone}
👨‍⚕️ ${userState.serviceName}
📅 ${moment(userState.selectedDate).format('DD.MM.YYYY (dddd)')}
🕐 ${userState.selectedTime}
💰 ${userState.price} рублей

📍 *Адрес клиники:*
г. Москва, ул. Здоровья, д. 123
м. Здоровье (5 мин пешком)

⏰ *Важно:*
• Приходите за 10 минут до назначенного времени
• При себе иметь документ, удостоверяющий личность
• За 24 часа до приема мы отправим напоминание

📞 *Контакты:*
Администратор: ${config.notifications.adminPhone}
Email: ${config.notifications.emailSupport}

Если планы изменятся, пожалуйста, сообщите об этом заранее.

Спасибо за выбор нашего центра! 🙏
      `;
      
      await bot.sendMessage(chatId, confirmMessage, {
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: [
            [
              { text: '📅 Мои записи', callback_data: 'my_appointments' },
              { text: '📞 Связаться', callback_data: 'contact_admin' }
            ],
            [
              { text: '🏠 Главное меню', callback_data: 'main_menu' }
            ]
          ]
        }
      });
      
    } catch (error) {
      console.error('Ошибка создания записи:', error);
      await bot.sendMessage(chatId, '❌ Произошла ошибка при создании записи. Пожалуйста, попробуйте позже или свяжитесь с администратором.');
    }
  }
  
  // Отменить запись
  static async cancelAppointment(bot, chatId, userId) {
    appointmentStates.delete(userId);
    
    await bot.sendMessage(chatId, '❌ Запись отменена. Вы можете начать новую запись в любое время.', {
      reply_markup: {
        inline_keyboard: [
          [
            { text: '📅 Записаться снова', callback_data: 'book_appointment' },
            { text: '🏠 Главное меню', callback_data: 'main_menu' }
          ]
        ]
      }
    });
  }
  
  // Показать записи пользователя
  static async showUserAppointments(bot, chatId, userId) {
    try {
      const appointments = await AppointmentService.getUserAppointments(userId);
      
      if (appointments.length === 0) {
        await bot.sendMessage(chatId, '📋 У вас пока нет записей на прием.', {
          reply_markup: {
            inline_keyboard: [
              [{ text: '📅 Записаться на прием', callback_data: 'book_appointment' }],
              [{ text: '🏠 Главное меню', callback_data: 'main_menu' }]
            ]
          }
        });
        return;
      }
      
      const message = '📋 *Ваши записи:*\n\n' + 
        appointments.slice(0, 10).map((apt, index) => {
          const date = moment(apt.date).format('DD.MM.YY');
          const status = AppointmentService.getStatusText(apt.status);
          return `${index + 1}. ${apt.serviceName}\n📅 ${date} в ${apt.time} - ${status}`;
        }).join('\n\n');
      
      await bot.sendMessage(chatId, message, {
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: [
            [{ text: '📅 Новая запись', callback_data: 'book_appointment' }],
            [{ text: '🏠 Главное меню', callback_data: 'main_menu' }]
          ]
        }
      });
      
    } catch (error) {
      console.error('Ошибка получения записей:', error);
      await bot.sendMessage(chatId, '❌ Ошибка получения записей. Попробуйте позже.');
    }
  }
  
  // Парсинг выбранной даты
  static parseSelectedDate(dateString) {
    try {
      // Формат: "Пн 25 дек"
      const parts = dateString.split(' ');
      if (parts.length !== 3) return null;
      
      const day = parseInt(parts[1]);
      const monthName = parts[2];
      const year = new Date().getFullYear();
      
      const months = {
        'янв': 0, 'фев': 1, 'мар': 2, 'апр': 3, 'май': 4, 'июн': 5,
        'июл': 6, 'авг': 7, 'сен': 8, 'окт': 9, 'ноя': 10, 'дек': 11
      };
      
      const month = months[monthName];
      if (month === undefined) return null;
      
      const date = new Date(year, month, day);
      
      // Проверяем, что дата не в прошлом
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      if (date < today) {
        date.setFullYear(year + 1);
      }
      
      return date;
    } catch (error) {
      console.error('Ошибка парсинга даты:', error);
      return null;
    }
  }
  
  // Создать клавиатуру времени с доступными слотами
  static createTimeKeyboard(availableSlots) {
    const keyboard = [];
    
    // Группируем по 3 времени в строке
    for (let i = 0; i < availableSlots.length; i += 3) {
      const row = availableSlots.slice(i, i + 3);
      keyboard.push(row);
    }
    
    keyboard.push(['⬅️ Назад']);
    
    return {
      keyboard: keyboard,
      resize_keyboard: true,
      one_time_keyboard: false
    };
  }
  
  // Получить состояние пользователя
  static getUserState(userId) {
    return appointmentStates.get(userId);
  }
  
  // Очистить состояние пользователя
  static clearUserState(userId) {
    appointmentStates.delete(userId);
  }
  
  // Обработать сообщения в контексте записи
  static async handleMessage(bot, chatId, text, userId, userInfo) {
    const userState = appointmentStates.get(userId);
    
    if (!userState) {
      return false; // Не в процессе записи
    }
    
    switch (userState.step) {
      case 'enter_contact':
        return await this.handleContactInput(bot, chatId, userId, text, userInfo);
      
      case 'enter_notes':
        return await this.handleNotesInput(bot, chatId, userId, text);
      
      default:
        return false;
    }
  }
}

module.exports = AppointmentHandler;
