import { Markup } from "telegraf"; 
 
export const keyboards = { 
    startKeyboard: Markup.keyboard([
        ['✍️ Записать', '👀 Просмотреть'],
        ['💸 Баланс', '⚙️ Редактировать интерфейс']
    ]).resize().oneTime(),

    mainCategoriesKeyboard: Markup.keyboard([
        ['📈 Доходы', '📉 Расходы'],
        ['💸 Баланс', '↩️ Назад']
    ]).resize().oneTime(), 

    setUpInterfaceKeyboard: Markup.keyboard([
        ['➕ Добавить категорию', '➖ Удалить категорию'],
        ['💱 Смена Валюты',  '↩️ Назад']
    ]), 
    
    selectCurrencyKeyboard: Markup.keyboard([
        ['UAH', 'USD'],
        ['EUR', 'GBP'],
        ['Ваша валюты', '↩️ Назад']
    ]), 

    incomeCategoriesKeyboard: Markup.keyboard([
        ['💰 Зарплата', '💻 Фриланс'],
        ['📈 Инвестиции', '🎁 Подарки'],
        ['➕ Другое', '↩️ Назад'],
        ['💸 Баланс']
    ]),

    expenseCategoriesKeyboard: Markup.keyboard([
        ['🍔 Еда', '🚌 Транспорт'],
        ['🏠 Жилье', '💡 Коммунальные платежи'],
        ['👕 Одежда', '🏥 Здоровье'],
        ['🚗 Машина', '↩️ Назад'],
        ['💸 Баланс']
    ]),
    
    cancelCommentKeyboard: Markup.keyboard([
        ['⏩ Продолжить без комментария']
    ]).resize().oneTime(), 
}