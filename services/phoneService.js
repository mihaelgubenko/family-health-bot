const axios = require('axios');
const config = require('../config.js');

class PhoneService {
  
  // Инициализация телефонного сервиса
  constructor() {
    this.apiKey = config.api.phoneService;
    this.adminPhone = config.notifications.adminPhone;
    this.callHistory = new Map();
  }
  
  // Запросить телефонную консультацию
  static async requestPhoneConsultation(userId, userInfo) {
    try {
      const consultationRequest = {
        userId: userId,
        firstName: userInfo.firstName,
        phone: userInfo.phone,
        requestTime: new Date(),
        status: 'pending',
        type: 'consultation',
        priority: 'normal'
      };
      
      // Сохранить запрос в базе или отправить уведомление администратору
      await this.notifyAdminAboutConsultation(consultationRequest);
      
      return {
        success: true,
        message: 'Запрос на телефонную консультацию принят',
        requestId: this.generateRequestId(),
        estimatedWaitTime: '15-30 минут'
      };
    } catch (error) {
      throw new Error(`Ошибка запроса консультации: ${error.message}`);
    }
  }
  
  // Уведомить администратора о запросе консультации
  static async notifyAdminAboutConsultation(request) {
    try {
      // Здесь можно интегрировать с реальным API телефонии
      // Например, Twilio, Asterisk, или другую систему
      
      console.log('Новый запрос на телефонную консультацию:', {
        userId: request.userId,
        name: request.firstName,
        phone: request.phone,
        time: request.requestTime
      });
      
      // Отправка SMS администратору (пример)
      const smsMessage = `
Новый запрос консультации:
👤 ${request.firstName}
📞 ${request.phone}
🕐 ${request.requestTime.toLocaleString('ru-RU')}
💬 Telegram ID: ${request.userId}
      `;
      
      // await this.sendSMS(config.notifications.adminPhone, smsMessage);
      
      return true;
    } catch (error) {
      console.error('Ошибка уведомления администратора:', error);
      return false;
    }
  }
  
  // Проверить статус телефонной консультации
  static async checkConsultationStatus(requestId) {
    try {
      // Здесь должна быть логика проверки статуса через API телефонии
      
      return {
        requestId: requestId,
        status: 'in_queue', // pending, in_queue, in_progress, completed, cancelled
        queuePosition: 2,
        estimatedWaitTime: '10-15 минут',
        specialist: null
      };
    } catch (error) {
      throw new Error(`Ошибка проверки статуса: ${error.message}`);
    }
  }
  
  // Отменить запрос на консультацию
  static async cancelConsultationRequest(requestId, userId) {
    try {
      // Логика отмены запроса
      
      console.log(`Отменен запрос консультации ${requestId} для пользователя ${userId}`);
      
      return {
        success: true,
        message: 'Запрос на консультацию отменен'
      };
    } catch (error) {
      throw new Error(`Ошибка отмены запроса: ${error.message}`);
    }
  }
  
  // Запланировать обратный звонок
  static async scheduleCallback(userId, userInfo, preferredTime) {
    try {
      const callback = {
        userId: userId,
        firstName: userInfo.firstName,
        phone: userInfo.phone,
        preferredTime: new Date(preferredTime),
        scheduledTime: new Date(),
        status: 'scheduled',
        type: 'callback',
        attempts: 0,
        maxAttempts: 3
      };
      
      // Сохранить запрос на обратный звонок
      await this.saveCallbackRequest(callback);
      
      return {
        success: true,
        message: 'Обратный звонок запланирован',
        callbackId: this.generateRequestId(),
        scheduledTime: callback.preferredTime
      };
    } catch (error) {
      throw new Error(`Ошибка планирования обратного звонка: ${error.message}`);
    }
  }
  
  // Сохранить запрос на обратный звонок
  static async saveCallbackRequest(callback) {
    try {
      // Здесь должна быть логика сохранения в базу данных
      console.log('Сохранен запрос на обратный звонок:', callback);
      return true;
    } catch (error) {
      console.error('Ошибка сохранения запроса:', error);
      return false;
    }
  }
  
  // Получить список доступных времен для обратного звонка
  static getAvailableCallbackTimes() {
    const times = [];
    const now = new Date();
    const workStart = 9; // 9:00
    const workEnd = 18;  // 18:00
    
    // Сегодня (если еще рабочее время)
    if (now.getHours() < workEnd) {
      const today = new Date();
      today.setMinutes(0, 0, 0);
      
      for (let hour = Math.max(now.getHours() + 1, workStart); hour < workEnd; hour++) {
        const time = new Date(today);
        time.setHours(hour);
        times.push({
          value: time.toISOString(),
          display: `Сегодня в ${hour}:00`
        });
      }
    }
    
    // Завтра
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setMinutes(0, 0, 0);
    
    for (let hour = workStart; hour < workEnd; hour++) {
      const time = new Date(tomorrow);
      time.setHours(hour);
      times.push({
        value: time.toISOString(),
        display: `Завтра в ${hour}:00`
      });
    }
    
    return times;
  }
  
  // Отправить SMS (заглушка для интеграции)
  static async sendSMS(phone, message) {
    try {
      // Здесь должна быть интеграция с SMS-провайдером
      console.log(`SMS на ${phone}: ${message}`);
      return true;
    } catch (error) {
      console.error('Ошибка отправки SMS:', error);
      return false;
    }
  }
  
  // Инициировать звонок (заглушка для интеграции)
  static async initiateCall(fromNumber, toNumber, callbackUrl) {
    try {
      // Здесь должна быть интеграция с телефонным API (Twilio, etc.)
      console.log(`Инициирован звонок с ${fromNumber} на ${toNumber}`);
      
      return {
        callId: this.generateRequestId(),
        status: 'initiated',
        estimatedDuration: '5-15 минут'
      };
    } catch (error) {
      console.error('Ошибка инициации звонка:', error);
      throw error;
    }
  }
  
  // Получить статистику телефонных консультаций
  static async getCallStatistics(startDate, endDate) {
    try {
      // Здесь должна быть логика получения статистики из базы
      
      return {
        totalRequests: 45,
        completedCalls: 38,
        averageWaitTime: '12 минут',
        averageCallDuration: '8 минут',
        satisfactionRating: 4.6,
        peakHours: ['10:00-11:00', '14:00-15:00', '16:00-17:00']
      };
    } catch (error) {
      throw new Error(`Ошибка получения статистики: ${error.message}`);
    }
  }
  
  // Форматировать информацию о телефонной консультации
  static formatConsultationInfo(consultation) {
    return `
📞 *Телефонная консультация*

🆔 ID запроса: ${consultation.requestId}
👤 Пациент: ${consultation.firstName}
📞 Телефон: ${consultation.phone}
🕐 Время запроса: ${consultation.requestTime}
📊 Статус: ${this.getConsultationStatusText(consultation.status)}

${consultation.queuePosition ? `📋 Позиция в очереди: ${consultation.queuePosition}` : ''}
${consultation.estimatedWaitTime ? `⏱️ Ожидаемое время: ${consultation.estimatedWaitTime}` : ''}
${consultation.specialist ? `👨‍⚕️ Специалист: ${consultation.specialist}` : ''}
    `;
  }
  
  // Получить текст статуса консультации
  static getConsultationStatusText(status) {
    const statuses = {
      'pending': '⏳ Ожидает обработки',
      'in_queue': '🕐 В очереди',
      'in_progress': '📞 Идет консультация',
      'completed': '✅ Завершена',
      'cancelled': '❌ Отменена',
      'missed': '❌ Пропущена'
    };
    
    return statuses[status] || status;
  }
  
  // Сгенерировать ID запроса
  static generateRequestId() {
    return 'REQ_' + Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
  }
  
  // Проверить рабочее время для звонков
  static isWorkingHours() {
    const now = new Date();
    const hours = now.getHours();
    const workStart = parseInt(config.schedule.workHours.start.split(':')[0]);
    const workEnd = parseInt(config.schedule.workHours.end.split(':')[0]);
    const isWorkingDay = config.schedule.workDays.includes(now.getDay());
    
    return isWorkingDay && hours >= workStart && hours < workEnd;
  }
  
  // Получить следующее доступное время для звонка
  static getNextAvailableTime() {
    const now = new Date();
    
    if (this.isWorkingHours()) {
      // Если сейчас рабочее время, следующий доступный слот через час
      const nextHour = new Date(now);
      nextHour.setHours(nextHour.getHours() + 1, 0, 0, 0);
      return nextHour;
    } else {
      // Если не рабочее время, следующий рабочий день в 9:00
      const nextDay = new Date(now);
      nextDay.setDate(nextDay.getDate() + 1);
      nextDay.setHours(9, 0, 0, 0);
      
      // Пропускаем выходные
      while (!config.schedule.workDays.includes(nextDay.getDay())) {
        nextDay.setDate(nextDay.getDate() + 1);
      }
      
      return nextDay;
    }
  }
}

module.exports = PhoneService;
