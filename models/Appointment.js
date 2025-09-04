const sqlite3 = require('sqlite3').verbose();
const path = require('path');

class Appointment {
  constructor() {
    this.dbPath = path.join(__dirname, '..', 'data', 'appointments.db');
    this.init();
  }

  init() {
    // Создаем папку data если не существует
    const fs = require('fs');
    const dataDir = path.dirname(this.dbPath);
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }

    this.db = new sqlite3.Database(this.dbPath, (err) => {
      if (err) {
        console.error('❌ Ошибка подключения к SQLite:', err.message);
      } else {
        console.log('✅ Подключение к SQLite успешно установлено');
        this.createTables();
      }
    });
  }

  createTables() {
    const createAppointmentsTable = `
      CREATE TABLE IF NOT EXISTS appointments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        userId TEXT NOT NULL,
        userName TEXT,
        specialist TEXT NOT NULL,
        appointmentDate TEXT NOT NULL,
        appointmentTime TEXT NOT NULL,
        status TEXT DEFAULT 'active',
        notes TEXT,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `;

    const createUsersTable = `
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        telegramId TEXT UNIQUE NOT NULL,
        firstName TEXT,
        lastName TEXT,
        username TEXT,
        phone TEXT,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `;

    this.db.run(createAppointmentsTable);
    this.db.run(createUsersTable);
  }

  // Создать запись на прием
  createAppointment(appointmentData) {
    return new Promise((resolve, reject) => {
      const { userId, userName, specialist, appointmentDate, appointmentTime, notes } = appointmentData;
      
      const sql = `
        INSERT INTO appointments (userId, userName, specialist, appointmentDate, appointmentTime, notes)
        VALUES (?, ?, ?, ?, ?, ?)
      `;
      
      this.db.run(sql, [userId, userName, specialist, appointmentDate, appointmentTime, notes], function(err) {
        if (err) {
          reject(err);
        } else {
          resolve({
            id: this.lastID,
            userId,
            userName,
            specialist,
            appointmentDate,
            appointmentTime,
            status: 'active',
            notes,
            createdAt: new Date().toISOString()
          });
        }
      });
    });
  }

  // Получить записи пользователя
  getUserAppointments(userId) {
    return new Promise((resolve, reject) => {
      const sql = `
        SELECT * FROM appointments 
        WHERE userId = ? AND status = 'active'
        ORDER BY appointmentDate ASC, appointmentTime ASC
      `;
      
      this.db.all(sql, [userId], (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows);
        }
      });
    });
  }

  // Получить все записи на определенную дату
  getAppointmentsByDate(date) {
    return new Promise((resolve, reject) => {
      const sql = `
        SELECT * FROM appointments 
        WHERE appointmentDate = ? AND status = 'active'
        ORDER BY appointmentTime ASC
      `;
      
      this.db.all(sql, [date], (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows);
        }
      });
    });
  }

  // Отменить запись
  cancelAppointment(appointmentId, userId) {
    return new Promise((resolve, reject) => {
      const sql = `
        UPDATE appointments 
        SET status = 'cancelled', updatedAt = CURRENT_TIMESTAMP
        WHERE id = ? AND userId = ?
      `;
      
      this.db.run(sql, [appointmentId, userId], function(err) {
        if (err) {
          reject(err);
        } else {
          resolve(this.changes > 0);
        }
      });
    });
  }

  // Сохранить информацию о пользователе
  saveUser(userInfo) {
    return new Promise((resolve, reject) => {
      const { telegramId, firstName, lastName, username, phone } = userInfo;
      
      const sql = `
        INSERT OR REPLACE INTO users (telegramId, firstName, lastName, username, phone)
        VALUES (?, ?, ?, ?, ?)
      `;
      
      this.db.run(sql, [telegramId, firstName, lastName, username, phone], function(err) {
        if (err) {
          reject(err);
        } else {
          resolve({
            id: this.lastID,
            telegramId,
            firstName,
            lastName,
            username,
            phone
          });
        }
      });
    });
  }

  // Получить записи, которые нужно напомнить
  getAppointmentsForReminder() {
    return new Promise((resolve, reject) => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const tomorrowStr = tomorrow.toISOString().split('T')[0];
      
      const sql = `
        SELECT * FROM appointments 
        WHERE appointmentDate = ? AND status = 'active'
        ORDER BY appointmentTime ASC
      `;
      
      this.db.all(sql, [tomorrowStr], (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows);
        }
      });
    });
  }

  // Закрыть соединение
  close() {
    if (this.db) {
      this.db.close((err) => {
        if (err) {
          console.error('Ошибка закрытия базы данных:', err.message);
        } else {
          console.log('Соединение с SQLite закрыто');
        }
      });
    }
  }
}

module.exports = Appointment;
