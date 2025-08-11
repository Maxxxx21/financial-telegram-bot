import { MyContext } from "./types";
import { session } from "telegraf";
import { keyboards } from "./keyboards";

 export const cancelFunction = async(ctx: MyContext) => { 
        if(ctx.scene.current) {
            const stepNumber = ctx.wizard.cursor; 
            
            if(stepNumber > 0) { 
                await ctx.reply(`🔙 Возвращаемся назад.`)
                return ctx.wizard.back(); 
            } else {
                await ctx.reply(`↩️ Действие успешно отменено.`, keyboards.startKeyboard);
                return ctx.scene.leave();
            }
            
        } else {
            await ctx.reply('В данный момент нет активных операций.')
            delete ctx.session.transactionCategory;
            delete ctx.session.transactionType;

            await ctx.reply(`Что будем %%% ?`, keyboards.startKeyboard
            )
            
        }
    }