# 🏥 Family Health Center Bot

Telegram бот для центра семейного здоровья с возможностью записи на прием, консультациями и интеграцией с внешними сервисами.

## ✨ Функции

- 📅 **Запись на прием** к различным специалистам
- 👨‍⚕️ **Специалисты**: нутрициолог, остеопат, массажист, иглорефлексотерапевт, физиотерапевт
- 🔬 **Биосканирование** организма
- 📞 **Телефонные консультации**
- 💰 **Информация о ценах** и расписании
- 📍 **Контакты** и адреса

## 🛠️ Технологии

- **Node.js** + **Express**
- **node-telegram-bot-api**
- **SQLite** (файловая база данных)
- **Moment.js** (работа с датами)

## 🚀 Быстрый старт (локально)

### 1. Клонирование и установка
```bash
git clone https://github.com/ваш-username/family-health-bot.git
cd family-health-bot
npm install
```

### 2. Настройка
```bash
# Скопируйте example конфигурацию
cp config.production.js config.js

# Отредактируйте config.js и добавьте:
# - TELEGRAM_BOT_TOKEN (от @BotFather)
# - TELEGRAM_ADMIN_ID (ваш Telegram ID)
```

### 3. Запуск (Windows)
```bash
# Настройка (один раз)
setup.bat

# Запуск бота
start-telegram.bat
```

### 4. Запуск (Linux/Mac)
```bash
npm run dev
```

## 🌍 Деплой на Railway

### 1. Подготовка GitHub
```bash
# Инициализация Git (если еще не сделано)
git init
git add .
git commit -m "Initial commit"

# Создайте репозиторий на GitHub
# Подключите remote и push
git remote add origin https://github.com/ваш-username/family-health-bot.git
git push -u origin main
```

### 2. Деплой на Railway

1. **Регистрация**: https://railway.app
2. **New Project** → **Deploy from GitHub repo**
3. **Выберите ваш репозиторий**
4. **Настройте переменные окружения**:

```bash
TELEGRAM_BOT_TOKEN=ваш_токен_от_botfather
TELEGRAM_ADMIN_ID=ваш_telegram_id
NODE_ENV=production
```

### 3. Настройка Webhook (автоматически)
Railway автоматически настроит webhook для Telegram бота.

## 📁 Структура проекта

```
family-health-bot/
├── 📄 server.js              # Локальная версия (polling)
├── 📄 server.production.js   # Продакшен версия (webhook)
├── 📄 config.js              # Локальная конфигурация (git ignore)
├── 📄 config.production.js   # Продакшен конфигурация (env vars)
├── 📁 services/              # Бизнес-логика
│   ├── appointmentService.js
│   ├── phoneService.js
│   └── bioscanService.js
├── 📁 handlers/              # Обработчики команд
│   └── appointmentHandler.js
├── 📁 models/                # Модели данных
│   └── Appointment.js
├── 📁 data/                  # База данных (создается автоматически)
│   └── appointments.db
└── 📄 package.json
```

## 🔧 Переменные окружения

### Обязательные:
- `TELEGRAM_BOT_TOKEN` - токен от @BotFather
- `TELEGRAM_ADMIN_ID` - ваш Telegram ID

### Опциональные:
- `NODE_ENV=production` - режим продакшена
- `PORT` - порт сервера (по умолчанию 3000)
- `DATABASE_PATH` - путь к базе данных

## 🤖 Планируемые улучшения

### 🧠 Интеграция с AI
- **OpenAI GPT** для умных ответов
- **Обучение на базе знаний** центра
- **Персонализированные рекомендации**

### Пример будущей конфигурации AI:
```javascript
ai: {
  enabled: true,
  provider: 'openai',
  apiKey: process.env.OPENAI_API_KEY,
  model: 'gpt-3.5-turbo',
  features: {
    smartAnswers: true,
    recommendations: true,
    symptomAnalysis: true
  }
}
```

### 📱 WhatsApp Business API
- Официальная интеграция (готова)
- Мультиплатформенность

### 🎙️ Голосовой помощник
- Телефонная интеграция
- Voice-to-text
- AI секретарь

## 🛟 Поддержка

- **Issues**: GitHub Issues
- **Email**: support@healthcenter.il
- **Telegram**: @your_support_bot

## 📄 Лицензия

MIT License - см. файл LICENSE.

---

**🚀 Готов к запуску за 5 минут!**