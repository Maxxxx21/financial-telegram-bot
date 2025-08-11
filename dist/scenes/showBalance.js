"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const telegraf_1 = require("telegraf");
const TransactionRepository_1 = require("../repositories/TransactionRepository");
const markup_1 = require("telegraf/typings/markup");
const showBalance = new telegraf_1.Scenes.WizardScene(`showBalanceScene`, async (ctx) => {
    const userId = ctx.from.id;
    const totalIncome = TransactionRepository_1.TransactionRepository.getTotalIncome(userId);
    const totalIncomeResult = totalIncome.total || 0;
    const formattedTotalIncome = totalIncome.toLocaleString(`ru-RU`, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    const totalExpense = TransactionRepository_1.TransactionRepository.getTotalExpense(userId);
    const totalExpenseResult = totalExpense.total || 0;
    const formattedTotalExpense = totalExpense.toLocaleString(`ru-RU`, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    const currentBalance = totalIncome - totalExpense;
    const formattedCurrentBalance = currentBalance.toLocaleString(`ru-RU`, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    let message = `💰 Ваш текущий баланс:\n`;
    message += `Доходы: ${formattedTotalIncome} UAH\n`;
    message += `Расходы: -${formattedTotalExpense} UAH\n`;
    message += `-----------------------------------------\n`;
    message += `Текущий баланс: ${formattedCurrentBalance} UAH.`;
    ctx.reply(message);
    await ctx.reply(`Что будем делать?`, markup_1.keyboards.startKeyboard);
    return ctx.wizard.next();
}, async (ctx) => {
    const type = ctx.message?.text;
    if (type === '👀 Просмотреть') {
        await ctx.scene.leave();
        return ctx.scene.enter(`calculationScene`);
    }
    else if (type === '✍️ Записать') {
        await ctx.scene.leave();
        return ctx.scene.enter(`recordTransactionScene`);
    }
});
