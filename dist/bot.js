"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const telegraf_1 = require("telegraf");
require("dotenv/config");
const keyboards_1 = require("./utils/keyboards");
const TransactionRepository_1 = require("./repositories/TransactionRepository");
const recordTransactionScene_1 = require("./scenes/recordTransactionScene");
const showBalanceScene_1 = require("./scenes/showBalanceScene");
const viewTransaction_1 = require("./scenes/viewTransaction");
const db_1 = require("./config/db");
const cancelFunction_1 = require("./utils/cancelFunction");
const token = process.env["BOT_TOKEN"];
if (!token) {
    console.error("There is some problems with starting Bot.");
    process.exit(1);
}
const transactionRepository = new TransactionRepository_1.TransactionRepository(db_1.database);
const bot = new telegraf_1.Telegraf(token);
console.log('Bot starting...!');
const stage = new telegraf_1.Scenes.Stage([recordTransactionScene_1.recordTransactionScene, showBalanceScene_1.showBalanceScene, viewTransaction_1.viewTransactionScene]);
bot.use((0, telegraf_1.session)());
bot.use((ctx, next) => {
    ctx.transactionRepository = transactionRepository;
    return next();
});
bot.use(stage.middleware());
bot.start((ctx) => {
    let username = ctx.from?.username || ctx.from?.first_name;
    ctx.reply(`
            Привет, ${username}! Выбери, что ты сейчас хочешь сделать с операцией:
            `, keyboards_1.keyboards.startKeyboard);
});
// bot.hears('👀 Просмотреть', async(ctx: MyContext) => { 
//         return ctx.scene.enter(`calculationScene`);
//     })
bot.hears('✍️ Записать', async (ctx) => {
    return ctx.scene.enter(`recordTransactionScene`);
});
bot.hears('👀 Просмотреть', async (ctx) => {
    return ctx.scene.enter(`viewTransactionScene`);
});
bot.hears('↩️ Назад', cancelFunction_1.cancelFunction);
bot.hears('💸 Баланс', async (ctx) => {
    return ctx.scene.enter(`showBalanceScene`);
});
bot.launch();
