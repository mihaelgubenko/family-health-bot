// Клавиатуры для Telegram бота центра семейного здоровья

// Главная клавиатура
function getMainKeyboard() {
  return {
    keyboard: [
      ['👨‍⚕️ Наши специалисты', '📅 Запись на прием'],
      ['🔬 Биосканирование', '💰 Цены и расписание'],
      ['📞 Телефонная консультация', '📍 Контакты']
    ],
    resize_keyboard: true,
    one_time_keyboard: false
  };
}

// Клавиатура услуг
function getServicesKeyboard() {
  return {
    keyboard: [
      ['🥗 Нутрициолог', '🦴 Остеопат'],
      ['💆‍♀️ Массажист', '🎯 Иглорефлексотерапия'],
      ['⚡ Физиотерапия', '🔬 Биосканирование'],
      ['⬅️ Назад']
    ],
    resize_keyboard: true,
    one_time_keyboard: false
  };
}

// Клавиатура времени записи
function getTimeKeyboard() {
  return {
    keyboard: [
      ['09:00', '10:00', '11:00'],
      ['12:00', '14:00', '15:00'],
      ['16:00', '17:00', '18:00'],
      ['⬅️ Назад']
    ],
    resize_keyboard: true,
    one_time_keyboard: false
  };
}

// Клавиатура дней недели
function getDaysKeyboard() {
  const today = new Date();
  const days = [];
  
  for (let i = 0; i < 7; i++) {
    const date = new Date(today);
    date.setDate(today.getDate() + i);
    
    const dayNames = ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'];
    const monthNames = ['янв', 'фев', 'мар', 'апр', 'май', 'июн', 'июл', 'авг', 'сен', 'окт', 'ноя', 'дек'];
    
    const dayName = dayNames[date.getDay()];
    const day = date.getDate();
    const month = monthNames[date.getMonth()];
    
    if (date.getDay() !== 0) { // Исключаем воскресенье
      days.push(`${dayName} ${day} ${month}`);
    }
  }
  
  // Разбиваем дни на строки по 2
  const keyboard = [];
  for (let i = 0; i < days.length; i += 2) {
    if (i + 1 < days.length) {
      keyboard.push([days[i], days[i + 1]]);
    } else {
      keyboard.push([days[i]]);
    }
  }
  
  keyboard.push(['⬅️ Назад']);
  
  return {
    keyboard: keyboard,
    resize_keyboard: true,
    one_time_keyboard: false
  };
}

// Клавиатура подтверждения
function getConfirmKeyboard() {
  return {
    keyboard: [
      ['✅ Подтвердить запись', '❌ Отменить'],
      ['⬅️ Назад']
    ],
    resize_keyboard: true,
    one_time_keyboard: false
  };
}

// Клавиатура "Назад"
function getBackKeyboard() {
  return {
    keyboard: [
      ['⬅️ Назад']
    ],
    resize_keyboard: true,
    one_time_keyboard: false
  };
}

// Inline клавиатура для быстрых действий
function getQuickActionsKeyboard() {
  return {
    inline_keyboard: [
      [
        { text: '📅 Записаться', callback_data: 'quick_book' },
        { text: '📞 Позвонить', callback_data: 'quick_call' }
      ],
      [
        { text: '💬 Консультация', callback_data: 'quick_consult' },
        { text: 'ℹ️ Подробнее', callback_data: 'quick_info' }
      ]
    ]
  };
}

// Inline клавиатура для выбора специалиста
function getSpecialistInlineKeyboard() {
  return {
    inline_keyboard: [
      [
        { text: '🥗 Нутрициолог', callback_data: 'book_nutritionist' },
        { text: '🦴 Остеопат', callback_data: 'book_osteopath' }
      ],
      [
        { text: '💆‍♀️ Массажист', callback_data: 'book_massage' },
        { text: '🎯 Иглорефлексотерапия', callback_data: 'book_acupuncture' }
      ],
      [
        { text: '⚡ Физиотерапия', callback_data: 'book_physiotherapy' },
        { text: '🔬 Биосканирование', callback_data: 'book_bioscan' }
      ],
      [
        { text: '⬅️ Назад', callback_data: 'main_menu' }
      ]
    ]
  };
}

// Клавиатура для оценки сервиса
function getRatingKeyboard() {
  return {
    inline_keyboard: [
      [
        { text: '⭐', callback_data: 'rate_1' },
        { text: '⭐⭐', callback_data: 'rate_2' },
        { text: '⭐⭐⭐', callback_data: 'rate_3' }
      ],
      [
        { text: '⭐⭐⭐⭐', callback_data: 'rate_4' },
        { text: '⭐⭐⭐⭐⭐', callback_data: 'rate_5' }
      ],
      [
        { text: '💬 Оставить отзыв', callback_data: 'write_review' }
      ]
    ]
  };
}

module.exports = {
  getMainKeyboard,
  getServicesKeyboard,
  getTimeKeyboard,
  getDaysKeyboard,
  getConfirmKeyboard,
  getBackKeyboard,
  getQuickActionsKeyboard,
  getSpecialistInlineKeyboard,
  getRatingKeyboard
};
