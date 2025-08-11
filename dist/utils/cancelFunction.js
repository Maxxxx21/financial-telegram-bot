"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.cancelFunction = void 0;
const keyboards_1 = require("./keyboards");
const cancelFunction = async (ctx) => {
    if (ctx.scene.current) {
        const stepNumber = ctx.wizard.cursor;
        if (stepNumber > 0) {
            await ctx.reply(`🔙 Возвращаемся назад.`);
            return ctx.wizard.back();
        }
        else {
            await ctx.reply(`↩️ Действие успешно отменено.`, keyboards_1.keyboards.startKeyboard);
            return ctx.scene.leave();
        }
    }
    else {
        await ctx.reply('В данный момент нет активных операций.');
        delete ctx.session.transactionCategory;
        delete ctx.session.transactionType;
        await ctx.reply(`Что будем %%% ?`, keyboards_1.keyboards.startKeyboard);
    }
};
exports.cancelFunction = cancelFunction;
