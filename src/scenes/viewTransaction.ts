import { Telegraf, Scenes, session } from "telegraf";
import { keyboards } from "../utils/keyboards";
import { MyContext } from "../utils/types";
import { ITransaction, TransactionRepository } from "../repositories/TransactionRepository";


const parseSingleDate = (dateInput: string): string | null => {
    const date = /^(0[1-9]|[12][0-9]|3[01])\.(0[1-9]|1[0-2])\.([0-9]{4})$/;
    
    if(date.test(dateInput)) { 
        const parts = dateInput.split('.'); 
        const day = parts[0]; 
        const month = parts[1]; 
        const year = parts[2]; 
        return `${year}-${month}-${day}`;  
    } else {
        return null
    }   
    }

    const processDateInput = (dateInput: string): { startDate: string, endDate: string} | null => { 
         if (dateInput.includes(`-`)) {
                const dates = dateInput.split(`-`).map(d=> d.trim());
                
                if(dates.length != 2){
                    return null; 
                }
                const startDate = parseSingleDate(dates[0]);
                const endDate = parseSingleDate(dates[1]); 

                if (startDate && endDate) { 
                    if(new Date(startDate) > new Date(endDate)) { 
                        return null;
                    }
                    return {startDate, endDate};
                }
                } else { 
                    const singleDate = parseSingleDate(dateInput); 

                    if(singleDate) { 
                        return {startDate: singleDate, endDate: singleDate}; 
                    }
                    return null;
                }

    }

export const viewTransactionScene = new Scenes.WizardScene<MyContext>(
        `viewTransactionScene`, 
        async(ctx) => {
            await ctx.reply(`Какую категорию будем смотреть?`, keyboards.mainCategoriesKeyboard)
            return ctx.wizard.next();
        }, 

        async(ctx) => { 
           const type = ctx.message.text as any; 

           if(type === '📈 Доходы' ) { 
            ctx.wizard.state.transactionType = 'income';
           } else if (type === '📉 Расходы') {
            ctx.wizard.state.transactionType = 'expense'; 
           } else if (type === '↩️ Назад') { 
            await ctx.reply('Что будем записывать ?', keyboards.startKeyboard);
            return ctx.scene.leave();
           } else if (type === '💸 Баланс') { 
                await ctx.scene.leave(); 
                return ctx.scene.enter(`showBalanceScene`); 
            } else { 
            await ctx.reply('Пожалуйста, выберите "Доходы" или "Расходы"');
           }

           await ctx.reply(`Укажите, пожалуйста, желаемую дату или период в формате: \n- **дд.мм.гггг** (для одной даты)\n- **дд.мм.гггг-дд.мм.гггг** (для периода)`, {parse_mode: "Markdown"});
           return ctx.wizard.next();  
        }, 

        async(ctx) => { 
            const userInput: any = (ctx.message as any)?.text;
            

            const userId: number = ctx.from.id; 
            const transactionType: string = ctx.wizard.state.transactionType;

            if(!transactionType) {
                await ctx.reply(`Произошла ошибка. Начните, пожалуйста, процесс заново.`, keyboards.startKeyboard);
                return ctx.scene.leave(); 
            }

            if (userInput === '↩️ Назад') { 
                await ctx.reply('Что будем записывать?', keyboards.startKeyboard);
            return ctx.wizard.back(); 
            }; 

            const date = processDateInput(userInput);
            let transactions: ITransaction[]; 

            if (typeof date === null) {
                await ctx.reply(`На моменте ввода даты произошла ошибка. Попробуйте, пожалуйста, еще раз. \nФормат для даты: **дд.мм.гггг**. \nФормат для периода: **дд.мм.гггг-дд.мм.гггг**. `, )
            }else if ( transactionType === 'income') { 
                if(date?.startDate === date?.endDate) { 
                    transactions =  await ctx.transactionRepository.viewTransactionIncomeDay(userId, date?.startDate); 
                } else { 
                    transactions = await ctx.transactionRepository.viewTransactionIncomePeriod(userId, date?.startDate, date?.endDate);
                }
            } else if(transactionType === 'expense') {
                if(date?.startDate === date?.endDate) { 
                    transactions =  await ctx.transactionRepository.viewTransactionExpenseDay(userId, date?.startDate); 
                } else { 
                    transactions = await ctx.transactionRepository.viewTransactionExpensePeriod(userId, date?.startDate, date?.endDate);
                }
            } else { 
                await ctx.reply (`Произошла ошибка. Попробуйте еще раз. -------`);
            }
            
            let message = `**Ваши ${transactionType === 'income' ? 'доходы' : 'расходы'}:**\n\n`; 
            
            if(transactions.length === 0) {
                message += `Нет данных за указанный период`;
            } else { 
                transactions.forEach((t: any) => { 
                    message += `${t.date} | ${t.category}: ${t.amount.toFixed(2)} UAH\n`
                });
            }

            await ctx.reply(message, {parse_mode: "Markdown"}); 
            await ctx.reply('Что будем делать дальше?',keyboards.startKeyboard)
            return ctx.scene.leave(); 
        }
    )
