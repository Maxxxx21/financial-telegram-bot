"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.showBalanceScene = void 0;
const telegraf_1 = require("telegraf");
const keyboards_1 = require("../utils/keyboards");
exports.showBalanceScene = new telegraf_1.Scenes.WizardScene(`showBalanceScene`, async (ctx) => {
    const userId = ctx.from.id;
    const totalIncome = ctx.transactionRepository.getTotalIncome(userId);
    const totalIncomeResult = totalIncome.total || 0;
    const formattedTotalIncome = totalIncome.toLocaleString(`ru-RU`, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    const totalExpense = ctx.transactionRepository.getTotalExpense(userId);
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
    await ctx.reply(`Что будем делать?`, keyboards_1.keyboards.startKeyboard);
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
