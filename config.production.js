// Конфигурация для продакшена (Railway/Heroku/etc)
// Использует переменные окружения для безопасности

const getServicePriceByCountry = (service, country = 'israel') => {
  const prices = {
    israel: {
      nutrition: 350,
      osteopathy: 450,
      massage: 280,
      acupuncture: 390,
      physiotherapy: 200,
      bioscan: 220,
      phone_consultation: 180
    }
  };
  
  return prices[country]?.[service] || 0;
};

module.exports = {
  // Telegram бот
  telegram: {
    token: process.env.TELEGRAM_BOT_TOKEN,     // ⬅️ Переменная окружения
    adminId: process.env.TELEGRAM_ADMIN_ID     // ⬅️ Переменная окружения
  },

  // WhatsApp Business API
  whatsapp: {
    accessToken: process.env.WHATSAPP_ACCESS_TOKEN,
    phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID,
    businessNumber: process.env.WHATSAPP_BUSINESS_NUMBER,
    webhookToken: process.env.WHATSAPP_WEBHOOK_TOKEN,
    apiVersion: 'v18.0'
  },

  // База данных SQLite (для Railway)
  database: {
    type: 'sqlite',
    path: process.env.DATABASE_PATH || './data/appointments.db'
  },

  // Услуги
  services: {
    nutrition: {
      available: true,
      price: getServicePriceByCountry('nutrition'),
      duration: 60,
      description: 'Консультация нутрициолога'
    },
    osteopathy: {
      available: true,
      price: getServicePriceByCountry('osteopathy'),
      duration: 60,
      description: 'Остеопатическое лечение'
    },
    massage: {
      available: true,
      price: getServicePriceByCountry('massage'),
      duration: 60,
      description: 'Лечебный массаж'
    },
    acupuncture: {
      available: true,
      price: getServicePriceByCountry('acupuncture'),
      duration: 45,
      description: 'Иглорефлексотерапия'
    },
    physiotherapy: {
      available: true,
      price: getServicePriceByCountry('physiotherapy'),
      duration: 30,
      description: 'Физиотерапия'
    },
    bioscan: {
      available: true,
      price: getServicePriceByCountry('bioscan'),
      duration: 30,
      description: 'Биосканирование организма'
    }
  },

  // Расписание работы
  schedule: {
    timezone: 'Asia/Jerusalem',
    workingDays: [1, 2, 3, 4, 5, 6], // Пн-Сб
    workingHours: {
      start: '09:00',
      end: '18:00',
      lunchBreak: {
        start: '13:00',
        end: '14:00'
      }
    },
    appointmentDuration: 60,
    advanceBookingDays: 30
  },

  // Уведомления
  notifications: {
    adminPhone: process.env.ADMIN_PHONE || '+972504611186',
    emailSupport: process.env.SUPPORT_EMAIL || 'info@healthcenter.il',
    reminderHours: 24
  },

  // Внешние сервисы
  phoneService: {
    demo_mode: true,
    provider: 'demo'
  },

  bioscanService: {
    demo_mode: true,
    provider: 'demo'
  },

  // Настройки AI (будущая функциональность)
  ai: {
    enabled: process.env.AI_ENABLED === 'true',
    provider: process.env.AI_PROVIDER || 'openai',
    apiKey: process.env.AI_API_KEY,
    model: process.env.AI_MODEL || 'gpt-3.5-turbo',
    maxTokens: 150,
    temperature: 0.7
  }
};
