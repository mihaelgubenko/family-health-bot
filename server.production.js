// Продакшен версия сервера для Railway/Heroku
// Автоматически определяет config.js или config.production.js

const fs = require('fs');
const path = require('path');

// Выбираем конфигурацию
let config;
if (process.env.NODE_ENV === 'production' || process.env.RAILWAY_ENVIRONMENT) {
  console.log('🚀 Production mode: using config.production.js');
  config = require('./config.production.js');
} else {
  // Проверяем наличие локального config.js
  const localConfigPath = path.join(__dirname, 'config.js');
  if (fs.existsSync(localConfigPath)) {
    console.log('🏠 Development mode: using config.js');
    config = require('./config.js');
  } else {
    console.log('⚙️ No local config, using config.production.js');
    config = require('./config.production.js');
  }
}

// Проверяем наличие необходимых переменных окружения
if (!config.telegram.token) {
  console.error('❌ TELEGRAM_BOT_TOKEN is required!');
  process.exit(1);
}

const TelegramBot = require('node-telegram-bot-api');
const express = require('express');
const cors = require('cors');
const moment = require('moment');

// Импорт существующих модулей
const AppointmentService = require('./services/appointmentService');
const PhoneService = require('./services/phoneService');
const BioscanService = require('./services/bioscanService');

// Инициализация бота
const bot = new TelegramBot(config.telegram.token, { 
  polling: !process.env.RAILWAY_ENVIRONMENT, // Polling только для локальной разработки
  webHook: !!process.env.RAILWAY_ENVIRONMENT  // Webhook для продакшена
});

// Webhook для Railway
if (process.env.RAILWAY_ENVIRONMENT) {
  const app = express();
  app.use(cors());
  app.use(express.json());
  
  const PORT = process.env.PORT || 3000;
  const WEBHOOK_URL = process.env.RAILWAY_STATIC_URL;
  
  if (WEBHOOK_URL) {
    bot.setWebHook(`${WEBHOOK_URL}/webhook/${config.telegram.token}`);
    
    app.post(`/webhook/${config.telegram.token}`, (req, res) => {
      bot.processUpdate(req.body);
      res.sendStatus(200);
    });
    
    console.log(`🌐 Webhook set to: ${WEBHOOK_URL}/webhook/${config.telegram.token}`);
  }
  
  // Health check endpoint
  app.get('/health', (req, res) => {
    res.json({ 
      status: 'ok', 
      timestamp: new Date().toISOString(),
      bot: 'telegram',
      environment: 'production'
    });
  });
  
  app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
  });
}

// Инициализация сервисов
let appointmentService;
let phoneService;
let bioscanService;

// Инициализация базы данных
function initializeDatabase() {
  try {
    console.log('🗃️  Используем SQLite базу данных');
    
    // Создаем директорию для базы данных
    const dbDir = path.dirname(config.database.path);
    if (!fs.existsSync(dbDir)) {
      fs.mkdirSync(dbDir, { recursive: true });
    }
    
    appointmentService = new AppointmentService(config);
    phoneService = new PhoneService(config);
    bioscanService = new BioscanService(config);
    
    console.log('✅ Подключение к SQLite успешно установлено');
    
  } catch (error) {
    console.error('❌ Ошибка инициализации базы данных:', error);
    process.exit(1);
  }
}

// Состояния пользователей
const userStates = new Map();

// Основные команды бота
bot.onText(/\/start/, async (msg) => {
  const chatId = msg.chat.id;
  const firstName = msg.from.first_name || 'Пользователь';
  
  const welcomeMessage = `🏥 Добро пожаловать в Центр семейного здоровья, ${firstName}!

Я ваш персональный помощник. Что вас интересует?`;

  const keyboard = {
    inline_keyboard: [
      [
        { text: '👨‍⚕️ Наши специалисты', callback_data: 'specialists' },
        { text: '📅 Запись на прием', callback_data: 'appointment' }
      ],
      [
        { text: '🔬 Биосканирование', callback_data: 'bioscan' },
        { text: '💰 Цены и расписание', callback_data: 'prices' }
      ],
      [
        { text: '📞 Консультация по телефону', callback_data: 'phone_consultation' },
        { text: '📍 Контакты', callback_data: 'contacts' }
      ]
    ]
  };

  await bot.sendMessage(chatId, welcomeMessage, { reply_markup: keyboard });
});

// Обработка callback запросов
bot.on('callback_query', async (query) => {
  const chatId = query.message.chat.id;
  const data = query.data;
  const messageId = query.message.message_id;

  try {
    await bot.answerCallbackQuery(query.id);

    switch (data) {
      case 'specialists':
        await showSpecialists(chatId, messageId);
        break;
      case 'appointment':
        await showAppointmentMenu(chatId, messageId);
        break;
      case 'bioscan':
        await showBioscanInfo(chatId, messageId);
        break;
      case 'prices':
        await showPricesAndSchedule(chatId, messageId);
        break;
      case 'phone_consultation':
        await handlePhoneConsultation(chatId, messageId);
        break;
      case 'contacts':
        await showContacts(chatId, messageId);
        break;
      case 'back_to_main':
        await bot.editMessageText('🏥 Главное меню:', {
          chat_id: chatId,
          message_id: messageId,
          reply_markup: getMainMenuKeyboard()
        });
        break;
    }
  } catch (error) {
    console.error('❌ Ошибка обработки callback:', error);
    await bot.sendMessage(chatId, 'Произошла ошибка. Попробуйте снова.');
  }
});

// Функции обработки меню (те же что и в оригинале)
async function showSpecialists(chatId, messageId = null) {
  const text = `👨‍⚕️ **Наши специалисты:**

🥗 **Нутрициолог** - составление программ питания
🦴 **Остеопат** - лечение опорно-двигательного аппарата
💆 **Массажист** - лечебный и расслабляющий массаж
🎯 **Иглорефлексотерапевт** - акупунктура и рефлексотерапия
🏃 **Физиотерапевт** - реабилитация и восстановление
🔬 **Биосканирование** - диагностика состояния организма`;

  const keyboard = {
    inline_keyboard: [
      [{ text: '📅 Записаться на прием', callback_data: 'appointment' }],
      [{ text: '⬅️ Назад в главное меню', callback_data: 'back_to_main' }]
    ]
  };

  if (messageId) {
    await bot.editMessageText(text, {
      chat_id: chatId,
      message_id: messageId,
      reply_markup: keyboard,
      parse_mode: 'Markdown'
    });
  } else {
    await bot.sendMessage(chatId, text, { 
      reply_markup: keyboard,
      parse_mode: 'Markdown' 
    });
  }
}

async function showAppointmentMenu(chatId, messageId = null) {
  const text = `📅 **Выберите специалиста для записи:**

Доступные услуги:`;

  const services = config.services;
  const keyboard = {
    inline_keyboard: []
  };

  // Добавляем кнопки для каждой доступной услуги
  Object.entries(services).forEach(([key, service]) => {
    if (service.available) {
      keyboard.inline_keyboard.push([{
        text: `${getServiceEmoji(key)} ${service.description} (${service.price}₪)`,
        callback_data: `book_${key}`
      }]);
    }
  });

  keyboard.inline_keyboard.push([
    { text: '⬅️ Назад в главное меню', callback_data: 'back_to_main' }
  ]);

  if (messageId) {
    await bot.editMessageText(text, {
      chat_id: chatId,
      message_id: messageId,
      reply_markup: keyboard,
      parse_mode: 'Markdown'
    });
  } else {
    await bot.sendMessage(chatId, text, { 
      reply_markup: keyboard,
      parse_mode: 'Markdown' 
    });
  }
}

// Остальные функции аналогично server.js...
function getServiceEmoji(service) {
  const emojis = {
    nutrition: '🥗',
    osteopathy: '🦴',
    massage: '💆',
    acupuncture: '🎯',
    physiotherapy: '🏃',
    bioscan: '🔬'
  };
  return emojis[service] || '⚕️';
}

function getMainMenuKeyboard() {
  return {
    inline_keyboard: [
      [
        { text: '👨‍⚕️ Наши специалисты', callback_data: 'specialists' },
        { text: '📅 Запись на прием', callback_data: 'appointment' }
      ],
      [
        { text: '🔬 Биосканирование', callback_data: 'bioscan' },
        { text: '💰 Цены и расписание', callback_data: 'prices' }
      ],
      [
        { text: '📞 Консультация по телефону', callback_data: 'phone_consultation' },
        { text: '📍 Контакты', callback_data: 'contacts' }
      ]
    ]
  };
}

// Инициализация при запуске
initializeDatabase();

console.log('🤖 Чат-бот центра семейного здоровья запущен!');
console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
console.log(`🚀 Mode: ${process.env.RAILWAY_ENVIRONMENT ? 'Railway Production' : 'Local Development'}`);

// Обработка ошибок
process.on('uncaughtException', (error) => {
  console.error('💥 Uncaught Exception:', error);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('💥 Unhandled Rejection at:', promise, 'reason:', reason);
});
