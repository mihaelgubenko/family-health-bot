# 🚀 Пошаговое руководство по деплою

## 📋 Что нужно подготовить:

1. **GitHub аккаунт**
2. **Railway аккаунт** (бесплатный)  
3. **Telegram Bot Token** (от @BotFather)
4. **Ваш Telegram ID**

---

## 🔧 Шаг 1: Подготовка проекта

### Проверьте файлы:
```bash
# Убедитесь что есть эти файлы:
✅ server.production.js     # Продакшен сервер
✅ config.production.js     # Продакшен конфигурация  
✅ package.json            # Зависимости
✅ .gitignore              # Исключения для Git
✅ README.md               # Документация
```

---

## 📤 Шаг 2: Загрузка на GitHub

### 2.1 Инициализация Git (если не сделано):
```bash
git init
git add .
git commit -m "🚀 Initial bot deployment"
```

### 2.2 Создание репозитория:
1. Идите на **https://github.com**
2. **New repository** 
3. Название: `family-health-bot`
4. **Public** ✅
5. **Create repository**

### 2.3 Подключение и push:
```bash
git remote add origin https://github.com/ВАШ_USERNAME/family-health-bot.git
git branch -M main
git push -u origin main
```

---

## 🌐 Шаг 3: Деплой на Railway

### 3.1 Регистрация:
1. Идите на **https://railway.app**
2. **Login with GitHub** 
3. Авторизуйте доступ к репозиториям

### 3.2 Создание проекта:
1. **New Project**
2. **Deploy from GitHub repo**
3. Выберите `family-health-bot`
4. **Deploy Now**

### 3.3 Настройка переменных:
1. В проекте: **Variables** tab
2. Добавьте переменные:

```bash
# ОБЯЗАТЕЛЬНЫЕ:
TELEGRAM_BOT_TOKEN = 8477627411:AAE7jbPfXJfgK7hKy_cZfY1UZ3xGVmoSZM0
TELEGRAM_ADMIN_ID = 6469030723
NODE_ENV = production

# ОПЦИОНАЛЬНЫЕ:
ADMIN_PHONE = +972504611186
SUPPORT_EMAIL = info@healthcenter.il
```

### 3.4 Проверка деплоя:
- Railway автоматически запустит `npm start`
- Посмотрите **Deployments** → **View Logs**
- Должно быть: `🤖 Чат-бот центра семейного здоровья запущен!`

---

## 🎯 Шаг 4: Настройка Telegram Webhook

### Railway автоматически:
✅ Создаст публичный URL  
✅ Настроит webhook для Telegram  
✅ Запустит сервер на нужном порту  

### Проверка работы:
1. Найдите ваш Railway URL в dashboard
2. Откройте `https://your-app.railway.app/health`
3. Должно показать: `{"status":"ok"}`

---

## 🧪 Шаг 5: Тестирование бота

### В Telegram:
1. Найдите вашего бота по username
2. `/start` 
3. Проверьте все кнопки меню
4. Попробуйте записаться на прием

### Логи в Railway:
- **Dashboard** → **Deployments** → **View Logs**
- Все действия пользователей видны в реальном времени

---

## 🔄 Шаг 6: Обновления

### Локальные изменения → Продакшен:
```bash
# Внесите изменения в код
git add .
git commit -m "✨ Добавил новую функцию"
git push

# Railway автоматически пересоберет и задеплоит!
```

---

## 🎯 Бонус: Планирование AI интеграции

### Подготовка к OpenAI:
```bash
# В Railway добавьте переменные:
AI_ENABLED = true
AI_PROVIDER = openai  
OPENAI_API_KEY = sk-ваш-ключ
AI_MODEL = gpt-3.5-turbo
```

### Будущие возможности:
- 🧠 **Умные ответы** на вопросы о здоровье
- 📊 **Анализ симптомов**
- 💡 **Персональные рекомендации**
- 🎙️ **Голосовой помощник**

---

## 🆘 Решение проблем

### Бот не отвечает:
1. **Railway Logs** → проверьте ошибки
2. **Variables** → правильный `TELEGRAM_BOT_TOKEN`?
3. **Deployments** → последний деплой успешен?

### Webhook не работает:
1. Railway должен дать публичный HTTPS URL
2. Telegram требует HTTPS для webhook
3. Проверьте `/health` endpoint

### База данных:
- SQLite создается автоматически
- Данные сохраняются между перезапусками

---

## ✅ Итог: у вас есть:

🤖 **Рабочий Telegram бот**  
🌍 **24/7 доступность**  
🔄 **Автоматические обновления**  
📊 **Логи и мониторинг**  
🚀 **Готовность к масштабированию**  

**Время деплоя: ~10 минут! 🎉**
