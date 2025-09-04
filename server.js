const TelegramBot = require('node-telegram-bot-api');
const express = require('express');
const cors = require('cors');
const moment = require('moment');
require('dotenv').config();

// Импорт модулей
// Пытаемся загрузить config.js, если не найден - используем config.example.js
let config;
try {
  config = require('./config.js');
} catch (error) {
  console.log('⚠️  config.js не найден, используем config.example.js');
  config = require('./config.example.js');
}
const { getMainKeyboard, getServicesKeyboard, getBackKeyboard } = require('./keyboards');
// Используем SQLite сервис
console.log('🗃️  Используем SQLite базу данных');
const AppointmentService = require('./services/appointmentService');
const PhoneService = require('./services/phoneService');
const BioscanService = require('./services/bioscanService');
const AppointmentHandler = require('./handlers/appointmentHandler');
const PhoneHandler = require('./handlers/phoneHandler');

// Инициализация приложения
const app = express();
app.use(cors());
app.use(express.json());

// SQLite база данных инициализируется автоматически при первом обращении
console.log('📁 SQLite база данных будет инициализирована автоматически');

// Инициализация Telegram бота
const bot = new TelegramBot(config.telegram.token, { polling: true });

// Состояния пользователей
const userStates = new Map();

// Обработчик команды /start
bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  const firstName = msg.from.first_name || 'друг';
  
  const welcomeMessage = `
🏥 *Добро пожаловать в Центр Семейного Здоровья!*

Привет, ${firstName}! 👋

Мы предлагаем комплексный подход к здоровью всей семьи с использованием современных технологий диагностики и лечения.

*Наши услуги:*
🥗 Нутрициология - персональные программы питания
🦴 Остеопатия - мягкие техники коррекции
💆‍♀️ Массаж - лечебный и расслабляющий
🎯 Иглорефлексотерапия - древние методы лечения
⚡ Физиотерапия - современное оборудование
🔬 Биосканирование - инновационная диагностика

📱 Если у вас нет возможности использовать чат-бот, вы всегда можете связаться с нами по телефону для консультации и записи.

Выберите интересующий вас раздел:
  `;
  
  bot.sendMessage(chatId, welcomeMessage, {
    parse_mode: 'Markdown',
    reply_markup: getMainKeyboard()
  });
});

// Обработчик команды /help
bot.onText(/\/help/, (msg) => {
  const chatId = msg.chat.id;
  
  const helpMessage = `
📋 *Справка по использованию бота*

*Основные команды:*
/start - Главное меню
/help - Эта справка
/contact - Контактная информация
/schedule - Расписание работы

*Как записаться на прием:*
1️⃣ Выберите "📅 Запись на прием"
2️⃣ Выберите нужного специалиста
3️⃣ Укажите удобное время
4️⃣ Подтвердите запись

*Если нужна помощь:*
📞 Телефон: ${config.notifications.adminPhone}
✉️ Email: ${config.notifications.emailSupport}

*Альтернативная связь:*
Если у вас нет возможности использовать чат-бот, вы можете связаться с нами по телефону для получения консультации и записи на прием.
  `;
  
  bot.sendMessage(chatId, helpMessage, {
    parse_mode: 'Markdown',
    reply_markup: getMainKeyboard()
  });
});

// Обработчик сообщений
bot.on('message', async (msg) => {
  const chatId = msg.chat.id;
  const text = msg.text;
  const userId = msg.from.id;
  
  // Пропускаем команды
  if (text && text.startsWith('/')) return;
  
  try {
    await handleMessage(chatId, text, userId);
  } catch (error) {
    console.error('Ошибка обработки сообщения:', error);
    bot.sendMessage(chatId, '❌ Произошла ошибка. Пожалуйста, попробуйте снова или обратитесь к администратору.', {
      reply_markup: getMainKeyboard()
    });
  }
});

// Основная функция обработки сообщений
async function handleMessage(chatId, text, userId) {
  const userInfo = userStates.get(userId) || { step: 'main' };
  
  // Проверяем, обрабатывает ли AppointmentHandler это сообщение
  const appointmentHandled = await AppointmentHandler.handleMessage(bot, chatId, text, userId, userInfo);
  if (appointmentHandled) return;
  
  switch (text) {
    case '👨‍⚕️ Наши специалисты':
      await showSpecialists(chatId);
      break;
      
    case '📅 Запись на прием':
      await AppointmentHandler.showAppointmentMenu(bot, chatId, userId);
      break;
      
    case '🔬 Биосканирование':
      await showBioscanInfo(chatId);
      break;
      
    case '💰 Цены и расписание':
      await showPricesAndSchedule(chatId);
      break;
      
    case '📞 Телефонная консультация':
      await PhoneHandler.showPhoneMenu(bot, chatId);
      break;
      
    case '📍 Контакты':
      await showContacts(chatId);
      break;
      
    case '⬅️ Назад':
      await showMainMenu(chatId);
      break;
      
    default:
      await handleUnknownMessage(chatId, text);
  }
}

// Показать специалистов
async function showSpecialists(chatId) {
  const message = `
👨‍⚕️ *Наши специалисты*

🥗 *Нутрициолог*
Индивидуальные программы питания, коррекция веса, работа с пищевыми расстройствами. Используем современные методы анализа состава тела.

🦴 *Остеопат* 
Мягкие мануальные техники для восстановления подвижности суставов и позвоночника. Работаем с младенцами, детьми и взрослыми.

💆‍♀️ *Массажист*
Лечебный, расслабляющий, спортивный массаж. Различные техники: классический, точечный, лимфодренажный.

🎯 *Иглорефлексотерапевт*
Традиционная китайская медицина, акупунктура, электропунктура. Лечение боли, стресса, функциональных нарушений.

⚡ *Физиотерапевт*
Современное оборудование: УВТ, лазеротерапия, магнитотерапия, электростимуляция. Реабилитация после травм.

🔬 *Диагност биосканирования*
Неинвазивная диагностика состояния всех систем организма за 30 минут. Выявление предрасположенностей к заболеваниям.
  `;
  
  bot.sendMessage(chatId, message, {
    parse_mode: 'Markdown',
    reply_markup: {
      inline_keyboard: [
        [{ text: '📅 Записаться на прием', callback_data: 'book_appointment' }],
        [{ text: '⬅️ Главное меню', callback_data: 'main_menu' }]
      ]
    }
  });
}

// Показать информацию о биосканировании
async function showBioscanInfo(chatId) {
  const bioscanInfo = BioscanService.getBioscanInfo();
  const procedureInfo = BioscanService.getScanProcedureInfo();
  
  const message = `
🔬 *${bioscanInfo.name}*

${bioscanInfo.description}

*Как это работает?*
• Анализ биоэлектрической активности клеток
• Сравнение с эталонными показателями
• Выявление функциональных нарушений на раннем этапе
• Определение предрасположенностей к заболеваниям

*Что диагностируется:*
${bioscanInfo.systems.slice(0, 4).map(system => `🔹 ${system.name}`).join('\n')}
🔹 И многое другое...

*Преимущества:*
✅ Безболезненно и безопасно
✅ Быстрое получение результатов
✅ Высокая точность диагностики
✅ Подходит для всех возрастов
✅ Выявление проблем на ранней стадии

*Длительность:* ${bioscanInfo.duration} минут
*Стоимость:* ${bioscanInfo.price} рублей

После диагностики вы получите подробный отчет с рекомендациями по улучшению здоровья.
  `;
  
  bot.sendMessage(chatId, message, {
    parse_mode: 'Markdown',
    reply_markup: {
      inline_keyboard: [
        [{ text: '📅 Записаться на биосканирование', callback_data: 'book_bioscan' }],
        [{ text: '📋 Как проходит процедура', callback_data: 'bioscan_procedure' }],
        [{ text: '🔬 Современные технологии', callback_data: 'modern_tech' }],
        [{ text: '📞 Консультация по телефону', callback_data: 'phone_consultation' }],
        [{ text: '⬅️ Главное меню', callback_data: 'main_menu' }]
      ]
    }
  });
}

// Показать цены и расписание
async function showPricesAndSchedule(chatId) {
  const services = config.services;
  
  const message = `
💰 *Цены и расписание*

*Стоимость услуг:*
🥗 Нутрициолог - ${services.nutritionist.price}₽ (${services.nutritionist.duration} мин)
🦴 Остеопат - ${services.osteopath.price}₽ (${services.osteopath.duration} мин)
💆‍♀️ Массаж - ${services.massage.price}₽ (${services.massage.duration} мин)
🎯 Иглорефлексотерапия - ${services.acupuncture.price}₽ (${services.acupuncture.duration} мин)
⚡ Физиотерапия - ${services.physiotherapy.price}₽ (${services.physiotherapy.duration} мин)
🔬 Биосканирование - ${services.bioscan.price}₽ (${services.bioscan.duration} мин)

*Режим работы:*
📅 Понедельник-Суббота: ${config.schedule.workHours.start} - ${config.schedule.workHours.end}
🕐 Обеденный перерыв: ${config.schedule.breakTime.start} - ${config.schedule.breakTime.end}
🚫 Воскресенье: выходной

*Скидки и акции:*
🎁 Первое посещение - скидка 10%
👨‍👩‍👧‍👦 Семейный пакет (3+ человека) - скидка 15%
🔄 Курсовое лечение (5+ процедур) - скидка 20%

*Способы оплаты:*
💳 Банковские карты
💰 Наличные
📱 Онлайн-платежи
  `;
  
  bot.sendMessage(chatId, message, {
    parse_mode: 'Markdown',
    reply_markup: {
      inline_keyboard: [
        [{ text: '📅 Записаться на прием', callback_data: 'book_appointment' }],
        [{ text: '⬅️ Главное меню', callback_data: 'main_menu' }]
      ]
    }
  });
}

// Показать информацию о телефонной консультации
async function showPhoneConsultation(chatId) {
  const message = `
📞 *Телефонная консультация*

Если у вас нет возможности использовать чат-бот или вы предпочитаете живое общение, мы предлагаем телефонные консультации.

*Что можно получить по телефону:*
🗣️ Консультацию специалистов
📅 Запись на прием
❓ Ответы на вопросы о процедурах
💡 Рекомендации по подготовке к процедурам
📋 Информацию о результатах анализов

*Время работы телефонной линии:*
📅 Понедельник-Суббота: ${config.schedule.workHours.start} - ${config.schedule.workHours.end}
☎️ Телефон: ${config.notifications.adminPhone}

*Стоимость консультации:*
🆓 Первичная консультация - бесплатно
💰 Подробная консультация специалиста - 500₽ (15-20 мин)

*Как получить консультацию:*
1️⃣ Позвоните по указанному номеру
2️⃣ Сообщите администратору о желании получить консультацию
3️⃣ Вас соединят с нужным специалистом
4️⃣ При необходимости запишитесь на очный прием

Наши специалисты готовы помочь вам даже на расстоянии! 🤝
  `;
  
  bot.sendMessage(chatId, message, {
    parse_mode: 'Markdown',
    reply_markup: {
      inline_keyboard: [
        [{ text: '📞 Связаться с нами', url: `https://wa.me/${config.notifications.adminPhone.replace('+', '')}?text=Здравствуйте! Хочу получить консультацию` }],
        [{ text: '📅 Записаться через бот', callback_data: 'book_appointment' }],
        [{ text: '⬅️ Главное меню', callback_data: 'main_menu' }]
      ]
    }
  });
}

// Показать контакты
async function showContacts(chatId) {
  const message = `
📍 *Наши контакты*

*Центр Семейного Здоровья*

📍 *Адрес:*
г. Москва, ул. Здоровья, д. 123
(м. Здоровье, 5 минут пешком)

📞 *Телефоны:*
Запись на прием: ${config.notifications.adminPhone}
Справочная: +7 (495) 123-45-67

⏰ *Режим работы:*
Пн-Сб: ${config.schedule.workHours.start} - ${config.schedule.workHours.end}
Вс: выходной

🌐 *Интернет:*
Сайт: www.familyhealth.ru
Email: ${config.notifications.emailSupport}

🚗 *Как добраться:*
• На метро: ст. "Здоровье", выход №3
• На автобусе: остановка "Центр здоровья"
• На автомобиле: бесплатная парковка

*Социальные сети:*
📱 Telegram: @FamilyHealthBot
📘 ВКонтакте: vk.com/familyhealth
📸 Instagram: @family_health_center
  `;
  
  bot.sendMessage(chatId, message, {
    parse_mode: 'Markdown',
    reply_markup: {
      inline_keyboard: [
        [{ text: '🗺️ Посмотреть на карте', url: 'https://yandex.ru/maps' }],
        [{ text: '📞 Написать в WhatsApp', url: `https://wa.me/${config.notifications.adminPhone.replace('+', '')}` }],
        [{ text: '⬅️ Главное меню', callback_data: 'main_menu' }]
      ]
    }
  });
}

// Показать главное меню
async function showMainMenu(chatId) {
  const message = `
🏥 *Главное меню*

Выберите интересующий вас раздел:
  `;
  
  bot.sendMessage(chatId, message, {
    parse_mode: 'Markdown',
    reply_markup: getMainKeyboard()
  });
}

// Функция для обработки неизвестных сообщений
async function handleUnknownMessage(chatId, text) {
  const message = `
❓ Извините, я не понял вашу команду.

Используйте меню ниже для навигации или введите одну из команд:
• /start - главное меню
• /help - справка
• /contact - контакты

Если нужна помощь, выберите "📞 Телефонная консультация" в меню.
  `;
  
  await bot.sendMessage(chatId, message, {
    reply_markup: getMainKeyboard()
  });
}

// Обработка callback запросов
bot.on('callback_query', async (callbackQuery) => {
  const message = callbackQuery.message;
  const data = callbackQuery.data;
  const chatId = message.chat.id;
  const userId = callbackQuery.from.id;
  
  await bot.answerCallbackQuery(callbackQuery.id);
  
  try {
    // Проверяем, обрабатывает ли PhoneHandler этот callback
    if (data.includes('phone') || data.includes('consultation') || data.includes('callback') || data.includes('free_') || data.includes('paid_')) {
      await PhoneHandler.handleCallback(bot, callbackQuery);
      return;
    }
    
    // Обрабатываем callback'и для записи на прием
    if (data.startsWith('book_') && data !== 'book_appointment') {
      const specialist = data.replace('book_', '');
      await AppointmentHandler.handleSpecialistSelection(bot, chatId, userId, specialist);
      return;
    }
    
    // Общие callback'и
    switch (data) {
      case 'main_menu':
        await showMainMenu(chatId);
        break;
        
      case 'book_appointment':
        await AppointmentHandler.showAppointmentMenu(bot, chatId, userId);
        break;
        
      case 'my_appointments':
        await AppointmentHandler.showUserAppointments(bot, chatId, userId);
        break;
        
      case 'bioscan_procedure':
        await showBioscanProcedure(chatId);
        break;
        
      case 'modern_tech':
        await showModernTechnologies(chatId);
        break;
        
      case 'contact_admin':
        await showContacts(chatId);
        break;
        
      default:
        await showMainMenu(chatId);
    }
  } catch (error) {
    console.error('Ошибка обработки callback:', error);
    await bot.sendMessage(chatId, '❌ Произошла ошибка. Попробуйте снова.', {
      reply_markup: getMainKeyboard()
    });
  }
});

// Показать процедуру биосканирования
async function showBioscanProcedure(chatId) {
  const procedureInfo = BioscanService.getScanProcedureInfo();
  
  await bot.sendMessage(chatId, procedureInfo, {
    parse_mode: 'Markdown',
    reply_markup: {
      inline_keyboard: [
        [{ text: '📋 Подготовка к процедуре', callback_data: 'bioscan_preparation' }],
        [{ text: '📅 Записаться на биосканирование', callback_data: 'book_bioscan' }],
        [{ text: '⬅️ Назад', callback_data: 'main_menu' }]
      ]
    }
  });
}

// Показать современные технологии
async function showModernTechnologies(chatId) {
  const technologies = BioscanService.getModernTechnologies();
  
  const message = `
🔬 *Современные технологии в медицине*

*🔍 Диагностические технологии:*
${technologies.diagnostic.map(tech => `• *${tech.name}*\n${tech.description}`).join('\n\n')}

*💊 Методы лечения:*
${technologies.treatment.slice(0, 2).map(tech => `• *${tech.name}*\n${tech.description}`).join('\n\n')}

*🥗 Нутрициология будущего:*
${technologies.nutrition.slice(0, 2).map(tech => `• *${tech.name}*\n${tech.description}`).join('\n\n')}

В нашем центре мы используем самые передовые технологии для точной диагностики и эффективного лечения.
  `;
  
  await bot.sendMessage(chatId, message, {
    parse_mode: 'Markdown',
    reply_markup: {
      inline_keyboard: [
        [{ text: '📅 Записаться на диагностику', callback_data: 'book_bioscan' }],
        [{ text: '📞 Консультация специалиста', callback_data: 'phone_consultation' }],
        [{ text: '⬅️ Главное меню', callback_data: 'main_menu' }]
      ]
    }
  });
}

// Настройка напоминаний
setInterval(async () => {
  try {
    await AppointmentService.sendReminders(bot);
  } catch (error) {
    console.error('Ошибка отправки напоминаний:', error);
  }
}, 60 * 60 * 1000); // Каждый час

// Запуск веб-сервера
app.listen(config.server.port, () => {
  console.log(`🚀 Сервер запущен на порту ${config.server.port}`);
});

// Обработка ошибок
process.on('unhandledRejection', (err) => {
  console.error('Необработанная ошибка:', err);
});

process.on('uncaughtException', (err) => {
  console.error('Критическая ошибка:', err);
  process.exit(1);
});

console.log('🤖 Чат-бот центра семейного здоровья запущен!');
