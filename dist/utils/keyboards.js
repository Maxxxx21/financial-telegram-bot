"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.keyboards = void 0;
const telegraf_1 = require("telegraf");
exports.keyboards = {
    startKeyboard: telegraf_1.Markup.keyboard([
        ['✍️ Записать', '👀 Просмотреть'],
        ['💸 Баланс', '⚙️ Редактировать интерфейс']
    ]).resize().oneTime(),
    mainCategoriesKeyboard: telegraf_1.Markup.keyboard([
        ['📈 Доходы', '📉 Расходы'],
        ['💸 Баланс', '↩️ Назад']
    ]).resize().oneTime(),
    setUpInterfaceKeyboard: telegraf_1.Markup.keyboard([
        ['➕ Добавить категорию', '➖ Удалить категорию'],
        ['💱 Смена Валюты', '↩️ Назад']
    ]),
    selectCurrencyKeyboard: telegraf_1.Markup.keyboard([
        ['UAH', 'USD'],
        ['EUR', 'GBP'],
        ['Ваша валюты', '↩️ Назад']
    ]),
    incomeCategoriesKeyboard: telegraf_1.Markup.keyboard([
        ['💰 Зарплата', '💻 Фриланс'],
        ['📈 Инвестиции', '🎁 Подарки'],
        ['➕ Другое', '↩️ Назад'],
        ['💸 Баланс']
    ]),
    expenseCategoriesKeyboard: telegraf_1.Markup.keyboard([
        ['🍔 Еда', '🚌 Транспорт'],
        ['🏠 Жилье', '💡 Коммунальные платежи'],
        ['👕 Одежда', '🏥 Здоровье'],
        ['🚗 Машина', '↩️ Назад'],
        ['💸 Баланс']
    ]),
    cancelCommentKeyboard: telegraf_1.Markup.keyboard([
        ['⏩ Продолжить без комментария']
    ]).resize().oneTime(),
};
