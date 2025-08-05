"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const telegraf_1 = require("telegraf");
const better_sqlite3_1 = __importDefault(require("better-sqlite3"));
require("dotenv/config");
const token = process.env["BOT_TOKEN"];
if (!token) {
    console.error("There is some problems with starting Bot.");
    process.exit(1);
}
const bot = new telegraf_1.Telegraf(token);
console.log('Bot starting...!');
const db = new better_sqlite3_1.default('finance.db', { verbose: console.log });
try {
    db.exec(`CREATE TABLE IF NOT EXISTS income(
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        amount REAL NOT NULL,
        category TEXT,
        date TEXT NOT NULL
        );
`);
    console.log('table income created.');
    db.exec(`
    CREATE TABLE IF NOT EXISTS expense( 
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      amount REAL NOT NULL,
      category TEXT,
      date TEXT NOT NULL
    );
`);
    console.log('table expense created.');
}
catch (err) {
    console.error("Troubles with database:", err.message);
    process.exit(1);
}
const insertIncomeStmt = db.prepare(`
        INSERT INTO income (user_id, amount, category, date) VALUES (?, ?, ?, ?)
    `);
const insertExpenseStmt = db.prepare(`
        INSERT INTO expense (user_id, amount, category, date) VALUES (?, ?, ?, ?)
    `);
// --- Keyboards ---
const startKeyboard = telegraf_1.Markup.keyboard([
    ['✍️ Записать', '👀 Просмотреть'],
    ['💸 Баланс']
]).resize().oneTime();
const mainCategories = telegraf_1.Markup.keyboard([
    ['📈 Доходы', '📉 Расходы'],
    ['💸 Баланс', '↩️ Назад']
]).resize().oneTime();
const incomeCategoriesKeyboard = telegraf_1.Markup.keyboard([
    ['💰 Зарплата', '💻 Фриланс'],
    ['📈 Инвестиции', '🎁 Подарки'],
    ['➕ Другое', '↩️ Назад'],
    ['💸 Баланс']
]).resize().oneTime();
const expenseCategoriesKeyboard = telegraf_1.Markup.keyboard([
    ['🍔 Еда', '🚌 Транспорт'],
    ['🏠 Жилье', '💡 Коммунальные платежи'],
    ['👕 Одежда', '🏥 Здоровье'],
    ['🚗 Машина', '↩️ Назад'],
    ['💸 Баланс']
]).resize().oneTime();
// --- Scene №1 Reacord Transaction ---
const recordTransaction = new telegraf_1.Scenes.WizardScene(`recordTransactionScene`, async (ctx) => {
    await ctx.reply(`Что будем записывать?`, mainCategories);
    return ctx.wizard.next();
}, async (ctx) => {
    const userId = ctx.from?.id;
    const type = ctx.message?.text;
    if (type === '📈 Доходы') {
        ctx.wizard.state.transactionType = "income";
        const incomeResult = db.prepare(`SELECT SUM(amount) AS total FROM income WHERE user_id=?`).get(userId);
        const totalIncome = incomeResult.total || 0;
        const formattedTotalIncome = totalIncome.toLocaleString(`ru-RU`, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        await ctx.reply(`💰 Ваш общий доход: ${formattedTotalIncome} UAH. \nВыберете категорию дохода: `, incomeCategoriesKeyboard);
        return ctx.wizard.next();
    }
    else if (type === '📉 Расходы') {
        ctx.wizard.state.transactionType = "expense";
        const expenseResult = db.prepare(`SELECT SUM(amount) AS total FROM expense WHERE user_id=?`).get(userId);
        const totalExpense = expenseResult.total || 0;
        const formattedTotalExpense = totalExpense.toLocaleString(`ru-RU`, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        await ctx.reply(`💰 Ваш общие расходы: ${formattedTotalExpense} UAH. \nВыберете категорию дохода: `, expenseCategoriesKeyboard);
        return ctx.wizard.next();
    }
    else if (type === '↩️ Назад') {
        await ctx.reply(`Возвращаемся назад.`);
        await ctx.reply(`Что делаем?`, startKeyboard);
        return ctx.scene.leave();
    }
}, async (ctx) => {
    const incomeCategories = ['💰 Зарплата', '💻 Фриланс', '📈 Инвестиции', '🎁 Подарки', '➕ Другое'];
    const expenseCategories = ['🍔 Еда', '🚌 Транспорт', '🏠 Жилье', '💡 Коммунальные платежи', '👕 Одежда', '🏥 Здоровье', '🚗 Машина'];
    const inputCategory = ctx.message.text;
    const isIncomeCategory = incomeCategories.includes(inputCategory);
    const isExpenseCategory = expenseCategories.includes(inputCategory);
    if (isIncomeCategory) {
        ctx.wizard.state.transactionCategory = inputCategory;
        await ctx.reply(`Введите сумму операции: `);
        return ctx.wizard.next();
    }
    else if (isExpenseCategory) {
        ctx.wizard.state.transactionCategory = inputCategory;
        await ctx.reply(`Введите сумму операции: `);
        console.log(`------ пизда здесь-----`);
        return ctx.wizard.next();
    }
    else if (inputCategory === '↩️ Назад') {
        await ctx.reply(`Что будем записывать?`, mainCategories);
        return ctx.wizard.selectStep(1);
    }
}, async (ctx) => {
    console.log(`---- и вот тут -----`);
    const amountText = ctx.message?.text;
    const userId = ctx.from.id;
    const date = new Date().toISOString().slice(0, 10);
    console.log(`------- тут -------`);
    if (amountText === '↩️ Назад') {
        await ctx.reply(`Возвразаемся назад.`);
        return ctx.wizard.selectStep(2);
    }
    if (!amountText) {
        await ctx.reply('Мы не можем обработать пустое поле. Введите сумму Вашей транзакции: ');
        return;
    }
    const amount = parseFloat(amountText);
    if (isNaN(amount)) {
        await ctx.reply('⛔️ Ошибка ввода. Ожидается числовое значение для суммы операции. Примеры допустимых форматов:\n- 1234 (целое число)\n- 567.89 (число с плавающей точкой).');
        return;
    }
    const transactionType = ctx.wizard.state.transactionType;
    const transactionCategory = ctx.wizard.state.transactionCategory;
    const formattedAmount = amount.toLocaleString(`ru-Ru`, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    if (transactionType === "income") {
        insertIncomeStmt.run(userId, amount, transactionCategory, date);
        await ctx.reply(`✅ Операция записана в Категорию: ${transactionCategory} \nСумма: ${formattedAmount} UAH. `);
        await ctx.reply('Хотите записать еще? Тогда выберете категорию, пожалуйста: ', incomeCategoriesKeyboard);
    }
    else if (transactionType === "expense") {
        insertExpenseStmt.run(userId, amount, transactionCategory, date);
        await ctx.reply(`✅ Операция записана в Категорию: ${transactionCategory} \nСумма: ${formattedAmount} UAH. `);
        await ctx.reply('Хотите записать еще? Тогда выберете категорию, пожалуйста: ', expenseCategoriesKeyboard);
    }
    delete ctx.wizard.state.transactionCategory;
    return ctx.wizard.selectStep(2);
});
// --- Scene №2 Calculate Transaction ---
const calculateTransaction = new telegraf_1.Scenes.WizardScene(`calculationScene`, async (ctx) => {
    await ctx.reply(`Какую категорию будем смотреть?`, mainCategories);
    return ctx.wizard.next();
}, async (ctx) => {
    const type = ctx.message.text;
    if (type === '📈 Доходы') {
        ctx.wizard.state.transactionType = 'income';
    }
    else if (type === '📉 Расходы') {
        ctx.wizard.state.transactionType = 'expense';
    }
    else if (type === '↩️ Назад') {
        await ctx.reply('Что будем записывать ?', startKeyboard);
        return ctx.scene.leave();
    }
    else {
        await ctx.reply('Пожалуйста, выберите "Доходы" или "Расходы"');
    }
    await ctx.reply(`Укажите, пожалуйста, желаемую дату или период в формате: \n- **2025-11-29** (для одной даты)\n- **2025-11-01/2025-11-30** (для периода)`, { parse_mode: "Markdown" });
    return ctx.wizard.next();
}, async (ctx) => {
    const dateOrPeriodInput = ctx.message?.text;
    const userId = ctx.from.id;
    const transactionType = ctx.wizard.state.transactionType;
    if (!transactionType) {
        await ctx.reply(`Произошла ошибка. Начните, пожалуйста, процесс заново.`, startKeyboard);
        return ctx.scene.leave();
    }
    if (dateOrPeriodInput === '↩️ Назад') {
        await ctx.reply('Что будем записывать?', startKeyboard);
        return ctx.wizard.selectStep(1);
    }
    const date = /^\d{4}-\d{2}-\d{2}$/;
    const period = /^\d{4}-\d{2}-\d{2}\/\d{4}-\d{2}-\d{2}$/;
    let query = ``;
    let params = [userId];
    if (date.test(dateOrPeriodInput)) {
        query = `SELECT amount, category, date FROM ${transactionType} WHERE user_id=? AND date=?`;
        params.push(dateOrPeriodInput);
    }
    else if (period.test(dateOrPeriodInput)) {
        const [startDate, endDate] = dateOrPeriodInput.split('/');
        query = `SELECT amount, category, date FROM ${transactionType} WHERE user_id=? AND date BETWEEN ? AND ?`;
        params.push(startDate, endDate);
    }
    else {
        await ctx.reply('Неверный формат. Пожалуйста, введите дату или период в формате: \n- **2025-11-29**\n- **2025-11-01/2025-11-30**', { parse_mode: 'Markdown' });
        return;
    }
    const transactions = db.prepare(query).all(...params);
    let message = `**Ваши ${transactionType === 'income' ? 'доходы' : 'расходы'}:**\n\n`;
    if (transactions.length === 0) {
        message += `Нет данных за указанный период`;
    }
    else {
        transactions.forEach((t) => {
            message += `${t.date} | ${t.category}: ${t.amount.toFixed(2)} UAH\n`;
        });
    }
    await ctx.reply(message, { parse_mode: "Markdown" });
    await ctx.reply('Что будем делать дальше?', startKeyboard);
    return ctx.scene.leave();
});
const stage = new telegraf_1.Scenes.Stage([recordTransaction, calculateTransaction]);
bot.use((0, telegraf_1.session)());
bot.use(stage.middleware());
// --- Handle keyboard press
bot.start((ctx) => {
    let username = ctx.from?.username || ctx.from?.first_name;
    ctx.reply(`
            Привет, ${username}! Выбери, что ты сейчас хочешь сделать с операцией:
            `, startKeyboard);
});
bot.hears('👀 Просмотреть', async (ctx) => {
    return ctx.scene.enter(`calculationScene`);
});
bot.hears('✍️ Записать', async (ctx) => {
    return ctx.scene.enter(`recordTransactionScene`);
});
bot.hears('💸 Баланс', async (ctx) => {
    const userId = ctx.from.id;
    const incomeResult = db.prepare(`SELECT SUM(amount) AS total FROM income WHERE user_id=?`).get(userId);
    const totalIncome = incomeResult.total || 0;
    const formattedTotalIncome = totalIncome.toLocaleString(`ru-RU`, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    const expenseResult = db.prepare(`SELECT SUM(amount) AS total FROM expense WHERE user_id=?`).get(userId);
    const totalExpense = expenseResult.total || 0;
    const formattedTotalExpense = totalExpense.toLocaleString(`ru-RU`, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    const currentBalance = totalIncome - totalExpense;
    const formattedCurrentBalance = currentBalance.toLocaleString(`ru-RU`, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    let message = `💰 Ваш текущий баланс:\n`;
    message += `Доходы: ${formattedTotalIncome} UAH\n`;
    message += `Расходы: -${formattedTotalExpense} UAH\n`;
    message += `-----------------------------------------\n`;
    message += `Текущий баланс: ${formattedCurrentBalance} UAH.`;
    ctx.reply(message);
    await ctx.reply(`Что будем делать?`, startKeyboard);
});
const handleClickCancel = async (ctx) => {
    if (ctx.scene.current) {
        const stepNumber = ctx.wizard.cursor;
        if (stepNumber > 0) {
            await ctx.reply(`🔙 Возвращаемся назад.`);
            return ctx.wizard.back();
        }
        else {
            await ctx.reply(`↩️ Действие успешно отменено.`, startKeyboard);
            return ctx.scene.leave();
        }
    }
    else {
        await ctx.reply('В данный момент нет активных операций.');
        delete ctx.session.transactionCategory;
        delete ctx.session.transactionType;
        await ctx.reply(`Что будем %%% ?`, startKeyboard);
    }
};
bot.hears('↩️ Назад', handleClickCancel);
bot.launch();
