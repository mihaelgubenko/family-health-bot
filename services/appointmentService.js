const Appointment = require('../models/Appointment');
const moment = require('moment');

class AppointmentService {
  constructor() {
    this.db = new Appointment();
  }

  // Создать запись на прием
  async createAppointment(appointmentData) {
    try {
      const appointment = await this.db.createAppointment(appointmentData);
      console.log('✅ Запись создана:', appointment);
      return appointment;
    } catch (error) {
      console.error('❌ Ошибка создания записи:', error);
      throw error;
    }
  }

  // Получить записи пользователя
  async getUserAppointments(userId) {
    try {
      const appointments = await this.db.getUserAppointments(userId);
      return appointments;
    } catch (error) {
      console.error('❌ Ошибка получения записей:', error);
      throw error;
    }
  }

  // Проверить доступность времени
  async isTimeSlotAvailable(specialist, date, time) {
    try {
      const appointments = await this.db.getAppointmentsByDate(date);
      const conflictingAppointment = appointments.find(apt => 
        apt.specialist === specialist && apt.appointmentTime === time
      );
      return !conflictingAppointment;
    } catch (error) {
      console.error('❌ Ошибка проверки доступности:', error);
      return false;
    }
  }

  // Получить доступные слоты времени
  async getAvailableTimeSlots(specialist, date) {
    try {
      const existingAppointments = await this.db.getAppointmentsByDate(date);
      const bookedTimes = existingAppointments
        .filter(apt => apt.specialist === specialist)
        .map(apt => apt.appointmentTime);

      // Генерируем слоты времени (09:00 - 18:00 с интервалом 30 минут)
      const timeSlots = [];
      for (let hour = 9; hour < 18; hour++) {
        for (let minute = 0; minute < 60; minute += 30) {
          const time = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
          if (!bookedTimes.includes(time)) {
            timeSlots.push(time);
          }
        }
      }

      return timeSlots;
    } catch (error) {
      console.error('❌ Ошибка получения доступных слотов:', error);
      return [];
    }
  }

  // Отменить запись
  async cancelAppointment(appointmentId, userId) {
    try {
      const result = await this.db.cancelAppointment(appointmentId, userId);
      if (result) {
        console.log('✅ Запись отменена:', appointmentId);
        return true;
      } else {
        console.log('❌ Запись не найдена или уже отменена:', appointmentId);
        return false;
      }
    } catch (error) {
      console.error('❌ Ошибка отмены записи:', error);
      throw error;
    }
  }

  // Сохранить информацию о пользователе
  async saveUserInfo(userInfo) {
    try {
      const user = await this.db.saveUser(userInfo);
      return user;
    } catch (error) {
      console.error('❌ Ошибка сохранения пользователя:', error);
      throw error;
    }
  }

  // Отправить напоминания о записях
  async sendReminders(bot) {
    try {
      const appointments = await this.db.getAppointmentsForReminder();
      
      for (const appointment of appointments) {
        const message = `
🔔 *Напоминание о записи*

Завтра у вас запись:
👨‍⚕️ Специалист: ${appointment.specialist}
📅 Дата: ${moment(appointment.appointmentDate).format('DD.MM.YYYY')}
🕐 Время: ${appointment.appointmentTime}

Если нужно отменить или перенести запись, напишите нам!
        `;

        try {
          await bot.sendMessage(appointment.userId, message, {
            parse_mode: 'Markdown'
          });
          console.log(`✅ Напоминание отправлено пользователю ${appointment.userId}`);
        } catch (sendError) {
          console.error(`❌ Ошибка отправки напоминания пользователю ${appointment.userId}:`, sendError);
        }
      }
    } catch (error) {
      console.error('❌ Ошибка отправки напоминаний:', error);
    }
  }

  // Получить статистику записей
  async getAppointmentStats() {
    try {
      // Поскольку это простая SQLite реализация, возвращаем базовую статистику
      const today = moment().format('YYYY-MM-DD');
      const appointments = await this.db.getAppointmentsByDate(today);
      
      return {
        today: appointments.length,
        total: 'N/A', // Можно добавить подсчет общего количества
        specialists: [...new Set(appointments.map(apt => apt.specialist))].length
      };
    } catch (error) {
      console.error('❌ Ошибка получения статистики:', error);
      return { today: 0, total: 0, specialists: 0 };
    }
  }

  // Закрыть соединение с базой данных
  close() {
    this.db.close();
  }
}

module.exports = new AppointmentService();
