const PhoneService = require('../services/phoneService');
const { getMainKeyboard } = require('../keyboards');

class PhoneHandler {
  
  // Показать меню телефонных консультаций
  static async showPhoneMenu(bot, chatId) {
    const isWorkingHours = PhoneService.isWorkingHours();
    const nextAvailableTime = PhoneService.getNextAvailableTime();
    
    const message = `
📞 *Телефонные консультации*

${isWorkingHours ? 
  '🟢 *Сейчас рабочее время - можем связаться с вами прямо сейчас!*' : 
  '🔴 *Сейчас нерабочее время*'
}

*Виды телефонных услуг:*

🆓 *Бесплатная консультация (до 10 минут)*
• Общие вопросы о наших услугах
• Информация о процедурах
• Помощь с записью на прием

💰 *Платная консультация специалиста (500₽)*
• Детальная консультация врача (15-20 минут)
• Рекомендации по лечению
• Анализ результатов обследований
• Второе мнение

📞 *Обратный звонок*
• Мы перезвоним в удобное для вас время
• Запланировать звонок на конкретное время

${!isWorkingHours ? 
  `⏰ *Ближайшее доступное время:* ${nextAvailableTime.toLocaleString('ru-RU')}` : 
  '⏰ *Среднее время ожидания:* 10-15 минут'
}

Что вас интересует?
    `;
    
    const keyboard = {
      inline_keyboard: []
    };
    
    if (isWorkingHours) {
      keyboard.inline_keyboard.push([
        { text: '🆓 Бесплатная консультация', callback_data: 'free_consultation' },
        { text: '💰 Платная консультация', callback_data: 'paid_consultation' }
      ]);
    }
    
    keyboard.inline_keyboard.push([
      { text: '📞 Заказать обратный звонок', callback_data: 'callback_request' }
    ]);
    
    keyboard.inline_keyboard.push([
      { text: '📋 Статус моего звонка', callback_data: 'call_status' },
      { text: 'ℹ️ Подробнее', callback_data: 'phone_info' }
    ]);
    
    keyboard.inline_keyboard.push([
      { text: '⬅️ Главное меню', callback_data: 'main_menu' }
    ]);
    
    await bot.sendMessage(chatId, message, {
      parse_mode: 'Markdown',
      reply_markup: keyboard
    });
  }
  
  // Обработать запрос бесплатной консультации
  static async handleFreeConsultation(bot, chatId, userId, userInfo) {
    try {
      const request = await PhoneService.requestPhoneConsultation(userId, {
        firstName: userInfo.first_name || 'Пациент',
        phone: userInfo.phone || 'Не указан'
      });
      
      if (request.success) {
        const message = `
✅ *Запрос на бесплатную консультацию принят!*

🆔 Номер запроса: \`${request.requestId}\`
⏱️ Ожидаемое время ожидания: ${request.estimatedWaitTime}

*Что дальше:*
1️⃣ В ближайшее время с вами свяжется администратор
2️⃣ Уточнит контактный номер телефона
3️⃣ Соединит с консультантом или специалистом

📞 *Если у вас срочный вопрос, звоните прямо сейчас:*
${'+7 (495) 123-45-67'}

💡 *Подсказка:* Подготовьте список вопросов заранее, чтобы консультация была максимально полезной.
        `;
        
        await bot.sendMessage(chatId, message, {
          parse_mode: 'Markdown',
          reply_markup: {
            inline_keyboard: [
              [{ text: '📋 Проверить статус', callback_data: `status_${request.requestId}` }],
              [{ text: '❌ Отменить запрос', callback_data: `cancel_${request.requestId}` }],
              [{ text: '🏠 Главное меню', callback_data: 'main_menu' }]
            ]
          }
        });
      }
    } catch (error) {
      await bot.sendMessage(chatId, '❌ Ошибка создания запроса. Попробуйте позже или звоните напрямую.');
    }
  }
  
  // Обработать запрос платной консультации
  static async handlePaidConsultation(bot, chatId, userId, userInfo) {
    const message = `
💰 *Платная консультация специалиста*

*Стоимость:* 500 рублей за 15-20 минут

*Что включено:*
✅ Детальная консультация врача
✅ Анализ ваших симптомов
✅ Рекомендации по лечению
✅ Ответы на все вопросы
✅ При необходимости - направление на обследования

*Наши специалисты:*
👨‍⚕️ Терапевт - общие вопросы здоровья
🥗 Нутрициолог - питание и диеты
🦴 Остеопат - проблемы опорно-двигательного аппарата
💆‍♀️ Специалист по массажу - боли в мышцах
🎯 Рефлексотерапевт - хронические заболевания

*Способы оплаты:*
💳 Банковская карта
📱 СБП (Система быстрых платежей)
💰 При посещении клиники

Выберите специалиста для консультации:
    `;
    
    await bot.sendMessage(chatId, message, {
      parse_mode: 'Markdown',
      reply_markup: {
        inline_keyboard: [
          [
            { text: '👨‍⚕️ Терапевт', callback_data: 'consult_therapist' },
            { text: '🥗 Нутрициолог', callback_data: 'consult_nutritionist' }
          ],
          [
            { text: '🦴 Остеопат', callback_data: 'consult_osteopath' },
            { text: '💆‍♀️ Массажист', callback_data: 'consult_massage' }
          ],
          [
            { text: '🎯 Рефлексотерапевт', callback_data: 'consult_acupuncture' }
          ],
          [
            { text: '⬅️ Назад', callback_data: 'phone_consultation' }
          ]
        ]
      }
    });
  }
  
  // Обработать запрос обратного звонка
  static async handleCallbackRequest(bot, chatId, userId, userInfo) {
    const availableTimes = PhoneService.getAvailableCallbackTimes();
    
    const message = `
📞 *Заказ обратного звонка*

Выберите удобное время для звонка:

*Доступное время:*
    `;
    
    const keyboard = {
      inline_keyboard: []
    };
    
    // Группируем времена по 2 в строке
    for (let i = 0; i < availableTimes.length; i += 2) {
      const row = [];
      
      row.push({
        text: availableTimes[i].display,
        callback_data: `callback_time_${availableTimes[i].value}`
      });
      
      if (i + 1 < availableTimes.length) {
        row.push({
          text: availableTimes[i + 1].display,
          callback_data: `callback_time_${availableTimes[i + 1].value}`
        });
      }
      
      keyboard.inline_keyboard.push(row);
    }
    
    keyboard.inline_keyboard.push([
      { text: '📝 Указать другое время', callback_data: 'custom_callback_time' }
    ]);
    
    keyboard.inline_keyboard.push([
      { text: '⬅️ Назад', callback_data: 'phone_consultation' }
    ]);
    
    await bot.sendMessage(chatId, message, {
      parse_mode: 'Markdown',
      reply_markup: keyboard
    });
  }
  
  // Подтвердить обратный звонок
  static async confirmCallback(bot, chatId, userId, selectedTime, userInfo) {
    try {
      const callback = await PhoneService.scheduleCallback(userId, {
        firstName: userInfo.first_name || 'Пациент',
        phone: userInfo.phone || 'Не указан'
      }, selectedTime);
      
      if (callback.success) {
        const timeStr = new Date(selectedTime).toLocaleString('ru-RU');
        
        const message = `
✅ *Обратный звонок запланирован!*

🆔 ID звонка: \`${callback.callbackId}\`
📅 Время звонка: ${timeStr}

*Что нужно сделать:*
1️⃣ Убедитесь, что ваш телефон включен и доступен
2️⃣ Подготовьте вопросы заранее
3️⃣ Найдите тихое место для разговора

📞 *Номер телефона для обратного звонка:*
Если ваш номер изменился, сообщите нам новый: ${'+7 (495) 123-45-67'}

⚠️ *Важно:* За 10 минут до звонка мы отправим напоминание.

Если планы изменятся, вы можете отменить или перенести звонок.
        `;
        
        await bot.sendMessage(chatId, message, {
          parse_mode: 'Markdown',
          reply_markup: {
            inline_keyboard: [
              [
                { text: '📋 Статус звонка', callback_data: `callback_status_${callback.callbackId}` },
                { text: '❌ Отменить', callback_data: `cancel_callback_${callback.callbackId}` }
              ],
              [
                { text: '🏠 Главное меню', callback_data: 'main_menu' }
              ]
            ]
          }
        });
      }
    } catch (error) {
      await bot.sendMessage(chatId, '❌ Ошибка планирования звонка. Попробуйте позже.');
    }
  }
  
  // Показать статус консультации/звонка
  static async showCallStatus(bot, chatId, requestId) {
    try {
      const status = await PhoneService.checkConsultationStatus(requestId);
      
      const message = `
📋 *Статус запроса*

🆔 ID: \`${status.requestId}\`
📊 Статус: ${status.status}

${status.queuePosition ? `📋 Позиция в очереди: ${status.queuePosition}` : ''}
${status.estimatedWaitTime ? `⏱️ Ожидаемое время: ${status.estimatedWaitTime}` : ''}
${status.specialist ? `👨‍⚕️ Специалист: ${status.specialist}` : ''}

*Уведомления:*
📱 Мы отправим уведомление, когда специалист будет готов к звонку
📞 Звонок поступит с номера: +7 (495) 123-45-67
      `;
      
      await bot.sendMessage(chatId, message, {
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: [
            [{ text: '🔄 Обновить статус', callback_data: `refresh_status_${requestId}` }],
            [{ text: '❌ Отменить запрос', callback_data: `cancel_request_${requestId}` }],
            [{ text: '⬅️ Назад', callback_data: 'phone_consultation' }]
          ]
        }
      });
      
    } catch (error) {
      await bot.sendMessage(chatId, '❌ Ошибка получения статуса. Попробуйте позже.');
    }
  }
  
  // Показать подробную информацию о телефонных услугах
  static async showPhoneInfo(bot, chatId) {
    const message = `
📞 *Подробная информация о телефонных услугах*

*🆓 Бесплатная консультация включает:*
• Информацию о наших услугах и ценах
• Помощь с выбором специалиста
• Объяснение процедур и их подготовки
• Помощь с записью на прием через бота
• Общие рекомендации (без медицинских назначений)

*💰 Платная консультация специалиста включает:*
• Полноценную медицинскую консультацию
• Анализ ваших симптомов и жалоб
• Рекомендации по лечению
• Интерпретацию результатов анализов
• Направления на дополнительные обследования
• Второе мнение по уже поставленному диагнозу

*📞 Технические особенности:*
• Звонки осуществляются с номера: +7 (495) 123-45-67
• Качество связи: HD-голос
• Запись разговора (с вашего согласия) для улучшения качества
• Возможность получить текстовый отчет после консультации

*⏰ График работы телефонной линии:*
Пн-Сб: 09:00 - 18:00 (МСК)
Воскресенье: выходной
Обеденный перерыв: 13:00 - 14:00

*🚨 Экстренные случаи:*
При острых состояниях обращайтесь в скорую помощь: 103
Наши консультации не заменяют экстренную медицинскую помощь.

*💳 Оплата консультаций:*
• Банковские карты (Visa, MasterCard, МИР)
• СБП (Система быстрых платежей)
• Яндекс.Деньги, WebMoney
• Наличными при посещении клиники
    `;
    
    await bot.sendMessage(chatId, message, {
      parse_mode: 'Markdown',
      reply_markup: {
        inline_keyboard: [
          [{ text: '📞 Заказать консультацию', callback_data: 'phone_consultation' }],
          [{ text: '⬅️ Назад', callback_data: 'phone_consultation' }]
        ]
      }
    });
  }
  
  // Отменить запрос на консультацию
  static async cancelRequest(bot, chatId, userId, requestId) {
    try {
      const result = await PhoneService.cancelConsultationRequest(requestId, userId);
      
      if (result.success) {
        await bot.sendMessage(chatId, '✅ Запрос на консультацию отменен.', {
          reply_markup: {
            inline_keyboard: [
              [{ text: '📞 Новая консультация', callback_data: 'phone_consultation' }],
              [{ text: '🏠 Главное меню', callback_data: 'main_menu' }]
            ]
          }
        });
      }
    } catch (error) {
      await bot.sendMessage(chatId, '❌ Ошибка отмены запроса. Обратитесь к администратору.');
    }
  }
  
  // Обработать callback данные, связанные с телефонными услугами
  static async handleCallback(bot, callbackQuery) {
    const chatId = callbackQuery.message.chat.id;
    const userId = callbackQuery.from.id;
    const data = callbackQuery.data;
    const userInfo = callbackQuery.from;
    
    await bot.answerCallbackQuery(callbackQuery.id);
    
    if (data === 'phone_consultation') {
      await this.showPhoneMenu(bot, chatId);
    } else if (data === 'free_consultation') {
      await this.handleFreeConsultation(bot, chatId, userId, userInfo);
    } else if (data === 'paid_consultation') {
      await this.handlePaidConsultation(bot, chatId, userId, userInfo);
    } else if (data === 'callback_request') {
      await this.handleCallbackRequest(bot, chatId, userId, userInfo);
    } else if (data === 'phone_info') {
      await this.showPhoneInfo(bot, chatId);
    } else if (data.startsWith('callback_time_')) {
      const selectedTime = data.replace('callback_time_', '');
      await this.confirmCallback(bot, chatId, userId, selectedTime, userInfo);
    } else if (data.startsWith('status_') || data.startsWith('refresh_status_')) {
      const requestId = data.replace(/^(status_|refresh_status_)/, '');
      await this.showCallStatus(bot, chatId, requestId);
    } else if (data.startsWith('cancel_') || data.startsWith('cancel_request_')) {
      const requestId = data.replace(/^(cancel_|cancel_request_)/, '');
      await this.cancelRequest(bot, chatId, userId, requestId);
    }
  }
}

module.exports = PhoneHandler;
