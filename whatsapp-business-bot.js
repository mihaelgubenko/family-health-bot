const express = require('express');
const axios = require('axios');
const cors = require('cors');
const moment = require('moment');

// Импорт существующих модулей
const config = require('./config.js');
const AppointmentService = require('./services/appointmentService');
const PhoneService = require('./services/phoneService');
const BioscanService = require('./services/bioscanService');

// Инициализация приложения
const app = express();
app.use(cors());
app.use(express.json());

// WhatsApp Business API конфигурация
const WHATSAPP_TOKEN = config.whatsapp.accessToken;
const PHONE_NUMBER_ID = config.whatsapp.phoneNumberId;
const API_VERSION = config.whatsapp.apiVersion;
const WEBHOOK_VERIFY_TOKEN = config.whatsapp.webhookToken;

// Базовый URL для WhatsApp Business API
const WHATSAPP_API_URL = `https://graph.facebook.com/${API_VERSION}/${PHONE_NUMBER_ID}/messages`;

// Состояния пользователей
const userStates = new Map();

// Webhook для верификации (GET запрос)
app.get('/webhook/whatsapp', (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  console.log('📞 Webhook verification request received');

  if (mode === 'subscribe' && token === WEBHOOK_VERIFY_TOKEN) {
    console.log('✅ Webhook verified successfully');
    res.status(200).send(challenge);
  } else {
    console.log('❌ Webhook verification failed');
    res.sendStatus(403);
  }
});

// Webhook для входящих сообщений (POST запрос)
app.post('/webhook/whatsapp', async (req, res) => {
  try {
    console.log('📱 Received WhatsApp webhook:', JSON.stringify(req.body, null, 2));

    const body = req.body;

    // Проверяем, что это сообщение от WhatsApp
    if (body.object === 'whatsapp_business_account') {
      body.entry?.forEach(async (entry) => {
        const changes = entry.changes?.[0];
        
        if (changes?.field === 'messages') {
          const messages = changes.value?.messages;
          
          if (messages && messages.length > 0) {
            for (const message of messages) {
              await handleIncomingMessage(message, changes.value);
            }
          }
        }
      });
    }

    res.status(200).send('OK');
  } catch (error) {
    console.error('❌ Error processing webhook:', error);
    res.status(500).send('Error');
  }
});

// Обработка входящих сообщений
async function handleIncomingMessage(message, messageData) {
  try {
    const phoneNumber = message.from;
    const messageText = message.text?.body || '';
    const messageType = message.type;

    console.log(`📱 Message from ${phoneNumber}: ${messageText}`);

    // Пропускаем статусные сообщения
    if (messageType !== 'text') {
      return;
    }

    // Получаем или создаем состояние пользователя
    const userState = userStates.get(phoneNumber) || { step: 'main' };

    // Обрабатываем сообщение
    await processMessage(phoneNumber, messageText, userState);

  } catch (error) {
    console.error('❌ Error handling message:', error);
    await sendMessage(phoneNumber, 'Произошла ошибка. Попробуйте снова.');
  }
}

// Обработка сообщений
async function processMessage(phoneNumber, text, userState) {
  // Команда для начала
  if (text.toLowerCase().includes('старт') || text.toLowerCase().includes('start')) {
    await sendWelcomeMessage(phoneNumber);
    return;
  }

  // Основное меню
  switch (text) {
    case '1':
      await showSpecialists(phoneNumber);
      break;
    case '2':
      await showAppointmentMenu(phoneNumber);
      break;
    case '3':
      await showBioscanInfo(phoneNumber);
      break;
    case '4':
      await showPricesAndSchedule(phoneNumber);
      break;
    case '5':
      await showContacts(phoneNumber);
      break;
    case '0':
      await sendWelcomeMessage(phoneNumber);
      break;
    default:
      await sendMessage(phoneNumber, 
        `Не понимаю команду "${text}". 
        
Отправьте номер от 1 до 5 для выбора услуги, или 0 для главного меню.`);
  }
}

// Отправка сообщений через WhatsApp Business API
async function sendMessage(phoneNumber, text, buttons = null) {
  try {
    const messageData = {
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to: phoneNumber,
      type: 'text',
      text: {
        body: text
      }
    };

    const response = await axios.post(WHATSAPP_API_URL, messageData, {
      headers: {
        'Authorization': `Bearer ${WHATSAPP_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('✅ Message sent successfully:', response.data);
    return response.data;

  } catch (error) {
    console.error('❌ Error sending message:', error.response?.data || error.message);
    throw error;
  }
}

// Приветственное сообщение
async function sendWelcomeMessage(phoneNumber) {
  const welcomeText = `🏥 *Добро пожаловать в Центр семейного здоровья!*

Я ваш персональный помощник. Выберите нужную услугу:

*1* - 👨‍⚕️ Наши специалисты
*2* - 📅 Запись на прием  
*3* - 🔬 Биосканирование
*4* - 💰 Цены и расписание
*5* - 📍 Контакты

Отправьте номер от 1 до 5 для выбора.`;

  await sendMessage(phoneNumber, welcomeText);
}

// Показать специалистов
async function showSpecialists(phoneNumber) {
  const specialists = `👨‍⚕️ *Наши специалисты:*

🥗 *Нутрициолог* - питание и диета
🦴 *Остеопат* - лечение опорно-двигательного аппарата  
💆 *Массажист* - лечебный массаж
🎯 *Иглорефлексотерапевт* - акупунктура
🏃 *Физиотерапевт* - реабилитация
🔬 *Биосканирование* - диагностика организма

Для записи отправьте *2*
Главное меню - *0*`;

  await sendMessage(phoneNumber, specialists);
}

// Меню записи на прием
async function showAppointmentMenu(phoneNumber) {
  const appointmentText = `📅 *Запись на прием*

Выберите специалиста:

*21* - 🥗 Нутрициолог (60 мин)
*22* - 🦴 Остеопат (60 мин)
*23* - 💆 Массажист (60 мин)
*24* - 🎯 Иглорефлексотерапевт (45 мин)
*25* - 🏃 Физиотерапевт (30 мин)
*26* - 🔬 Биосканирование (30 мин)

Главное меню - *0*`;

  await sendMessage(phoneNumber, appointmentText);
}

// Информация о биосканировании
async function showBioscanInfo(phoneNumber) {
  const bioscanText = `🔬 *Биосканирование организма*

*Что это?*
Комплексная диагностика состояния всех систем организма методом биорезонансного сканирования.

*Что покажет:*
• Состояние органов и систем
• Уровень витаминов и микроэлементов  
• Пищевые непереносимости
• Рекомендации по питанию
• Подбор БАДов

*Время:* 30 минут
*Подготовка:* не требуется

Записаться - *2*
Главное меню - *0*`;

  await sendMessage(phoneNumber, bioscanText);
}

// Цены и расписание
async function showPricesAndSchedule(phoneNumber) {
  const pricesText = `💰 *Цены и расписание*

*Услуги в Израиле (₪):*
🥗 Нутрициолог - 350₪
🦴 Остеопат - 450₪  
💆 Массаж - 280₪
🎯 Иглорефлексотерапия - 390₪
🏃 Физиотерапия - 200₪
🔬 Биосканирование - 220₪

*Расписание:*
Пн-Сб: 09:00-18:00
Обеденный перерыв: 13:00-14:00
Воскресенье - выходной

Записаться - *2*
Главное меню - *0*`;

  await sendMessage(phoneNumber, pricesText);
}

// Контакты
async function showContacts(phoneNumber) {
  const contactsText = `📍 *Наши контакты*

📱 *Телефон:* ${config.notifications.adminPhone}
📧 *Email:* ${config.notifications.emailSupport}

🏥 *Адрес:* 
г. Ашдод, ул. Примерная, д. 123
(точный адрес уточните по телефону)

🕐 *Часы работы:*
Пн-Сб: 09:00-18:00
Воскресенье - выходной

Записаться на прием - *2*
Главное меню - *0*`;

  await sendMessage(phoneNumber, contactsText);
}

// Запуск сервера
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`🚀 WhatsApp Business Bot запущен на порту ${PORT}`);
  console.log(`📱 Webhook URL: http://localhost:${PORT}/webhook/whatsapp`);
  console.log('📞 Готов к приему сообщений WhatsApp Business API');
});

module.exports = app;
