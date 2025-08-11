import { Telegraf, Scenes, session } from "telegraf";
import "dotenv/config"; 

import { keyboards} from "./utils/keyboards";
import { TransactionRepository } from "./repositories/TransactionRepository";
import { MyContext } from "./utils/types";
import { recordTransactionScene,  } from "./scenes/recordTransactionScene";
import { showBalanceScene } from "./scenes/showBalanceScene";
import { viewTransactionScene } from "./scenes/viewTransaction";
import { database } from "./config/db";
import {cancelFunction} from "./utils/cancelFunction"


const token = process.env["BOT_TOKEN"] as string;

if(!token) { 
    console.error("There is some problems with starting Bot.")
    process.exit(1); 
}

const transactionRepository = new TransactionRepository(database);

const bot = new Telegraf<MyContext>(token);
console.log('Bot starting...!'); 

const stage = new Scenes.Stage<MyContext>([recordTransactionScene, showBalanceScene, viewTransactionScene]); 

bot.use(session()); 

bot.use((ctx, next) => {
    ctx.transactionRepository = transactionRepository;
    return next();
})
bot.use(stage.middleware()); 




bot.start((ctx: MyContext) => {
        let username: string | undefined = ctx.from?.username || ctx.from?.first_name; 
        ctx.reply(`
            Привет, ${username}! Выбери, что ты сейчас хочешь сделать с операцией:
            `, keyboards.startKeyboard
        );
    }); 
   
// bot.hears('👀 Просмотреть', async(ctx: MyContext) => { 
//         return ctx.scene.enter(`calculationScene`);
//     })

bot.hears('✍️ Записать', async(ctx: MyContext) => { 
        return ctx.scene.enter(`recordTransactionScene`);
    }); 

bot.hears('👀 Просмотреть', async(ctx: MyContext) => { 
    return ctx.scene.enter(`viewTransactionScene`);
});

bot.hears('↩️ Назад',cancelFunction);

bot.hears('💸 Баланс',  async(ctx: MyContext) => { 
        return ctx.scene.enter(`showBalanceScene`);
    });

bot.launch();