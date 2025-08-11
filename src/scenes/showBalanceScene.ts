import { Scenes } from "telegraf";
import { TransactionRepository } from "../repositories/TransactionRepository";
import { MyContext } from "../utils/types";
import { keyboards } from "../utils/keyboards";

export const showBalanceScene = new Scenes.WizardScene<MyContext> (
        `showBalanceScene`, 
        async (ctx) => { 
            const userId = ctx.from.id;

            const totalIncome = ctx.transactionRepository.getTotalIncome(userId);
            const totalIncomeResult: number = totalIncome.total || 0;
            const formattedTotalIncome = totalIncome.toLocaleString(`ru-RU`, {minimumFractionDigits: 2, maximumFractionDigits: 2})

            const totalExpense = ctx.transactionRepository.getTotalExpense(userId);  
            const totalExpenseResult: number = totalExpense.total || 0;
            const formattedTotalExpense = totalExpense.toLocaleString(`ru-RU`, {minimumFractionDigits: 2, maximumFractionDigits: 2});

            const currentBalance = totalIncome - totalExpense; 
            const formattedCurrentBalance = currentBalance.toLocaleString(`ru-RU`, {minimumFractionDigits: 2, maximumFractionDigits: 2});


            let message: string = `💰 Ваш текущий баланс:\n`; 
            message += `Доходы: ${formattedTotalIncome} UAH\n`;
            message += `Расходы: -${formattedTotalExpense} UAH\n`;
            message += `-----------------------------------------\n`;
            message += `Текущий баланс: ${formattedCurrentBalance} UAH.`
            ctx.reply(message); 

            await ctx.reply(`Что будем делать?`, keyboards.startKeyboard); 
            return ctx.wizard.next(); 
        }, 

        async (ctx) => {
            const type: string = ctx.message?.text;
            if(type === '👀 Просмотреть')  { 
                await ctx.scene.leave(); 
                return ctx.scene.enter(`calculationScene`);
            } else if (type === '✍️ Записать') { 
                await ctx.scene.leave(); 
                return ctx.scene.enter(`recordTransactionScene`);
    }
    })