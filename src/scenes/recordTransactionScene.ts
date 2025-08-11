import { Telegraf, Scenes, session } from "telegraf";
import { keyboards } from "../utils/keyboards";
import { database } from "../config/db";
import { MyContext } from "../utils/types";
import { ITransaction, TransactionRepository } from "../repositories/TransactionRepository";


export const recordTransactionScene = new Scenes.WizardScene<MyContext>(
        `recordTransactionScene`, 
    async (ctx) => {

        await ctx.reply(`Что будем записывать?`, keyboards.mainCategoriesKeyboard); 
        return ctx.wizard.next(); 
        },

        async(ctx) => { 
            if(!ctx.message || !('text' in ctx.message) || !ctx.from.id) { 
                await ctx.reply(`Произошла ошибка. Используйте, пожалуйста, меню кнопок.`);
                return ctx.wizard.back();
            }

            const userId: number = ctx.from.id;
            const type: string | undefined = ctx.message.text;
            const currency = ctx.transactionRepository.getUserCurrency(userId) || "UAH"; 

            if (type === '📈 Доходы') { 
                ctx.wizard.state.transactionType = "income";
             
                const totalIncome:number = ctx.transactionRepository.getTotalIncome(userId); 
                const formattedTotalIncome: string = totalIncome.toLocaleString(`ru-RU`, {minimumFractionDigits: 2, maximumFractionDigits: 2});


                await ctx.reply(`💰 Ваш общий доход: ${formattedTotalIncome} ${currency}. \nВыберете категорию дохода: `, keyboards.incomeCategoriesKeyboard);
                return ctx.wizard.next(); 
            } else if(type === '📉 Расходы') {
                ctx.wizard.state.transactionType = "expense";
             
                const totalExpense: number = ctx.transactionRepository.getTotalExpense(userId);                 
                const formattedTotalExpense = totalExpense.toLocaleString(`ru-RU`, {minimumFractionDigits: 2, maximumFractionDigits: 2});


                await ctx.reply(`💰 Ваш общие расходы: ${formattedTotalExpense} ${currency}. \nВыберете категорию расходов: `, keyboards.expenseCategoriesKeyboard);
                return ctx.wizard.next();
            } else if (type ==='↩️ Назад') {
                await ctx.reply(`Возвращаемся назад.`, keyboards.startKeyboard); 
                return ctx.wizard.back();
                 

            } else if (type === '💸 Баланс') {
                return ctx.scene.enter(`showBalanceScene`);  
            } else { 
                await ctx.reply(`К сожалению, произошла непредвиденная ошибка. Начните, пожалуйста, заново.`, keyboards.startKeyboard);
                return ctx.scene.leave(); 
        }
    },

        async(ctx) => { 
            if(!ctx.message || !('text' in ctx.message) || !ctx.from.id) { 
                await ctx.reply(`Произошла ошибка. Используйте, пожалуйста, меню кнопок.`);
                return ctx.wizard.back();
            }

            const incomeCategories:string[] = ['💰 Зарплата', '💻 Фриланс','📈 Инвестиции', '🎁 Подарки','➕ Другое'];
            const expenseCategories: string[]  =['🍔 Еда', '🚌 Транспорт','🏠 Жилье', '💡 Коммунальные платежи','👕 Одежда', '🏥 Здоровье','🚗 Машина']; 

            const inputCategory: string  = ctx.message.text; 

            const isIncomeCategory = incomeCategories.includes(inputCategory); 
            const isExpenseCategory = expenseCategories.includes(inputCategory); 

            if(isIncomeCategory) {
                ctx.wizard.state.transactionCategory = inputCategory;
                await ctx.reply(`Введите сумму операции: `);
                return ctx.wizard.next(); 
            } else if (isExpenseCategory) { 
                ctx.wizard.state.transactionCategory = inputCategory; 
                await ctx.reply(`Введите сумму операции: `);
                return ctx.wizard.next();
            } else if (inputCategory === '↩️ Назад') {
                await ctx.reply(`Что будем записывать?`, keyboards.mainCategoriesKeyboard); 
                return ctx.wizard.back();  
            } else if (inputCategory === '💸 Баланс') { 
                await ctx.scene.leave(); 
                return ctx.scene.enter(`showBalanceScene`); 
            } else { 
                await ctx.reply(`Произошла незвестная ошибка. Давайте попробуем заново :)`, keyboards.startKeyboard);
                return ctx.scene.leave();
            }
        },

        async (ctx) => { 
            if(!ctx.message || !('text' in ctx.message) || !ctx.from.id) { 
                await ctx.reply(`Произошла ошибка. Используйте, пожалуйста, меню кнопок.`);
                return ctx.wizard.back();
            }
            
            const amountText: string | undefined = ctx.message.text;
            const userId: number = ctx.from.id;
            

            if(amountText === '↩️ Назад') { 
                await ctx.reply(`Возвразаемся назад.`);
                return ctx.wizard.back(); 
            }
            if ( amountText === '💸 Баланс') { 
                await ctx.scene.leave(); 
                return ctx.scene.enter(`showBalanceScene`); 
            }

            if(!amountText) {
                await ctx.reply(' ⛔️ Мы не можем обработать пустое поле. Введите сумму Вашей транзакции: ');
                return
            }

            const amount: number = parseFloat(amountText);
            if(isNaN(amount)) { 
                await ctx.reply('⛔️ Ошибка ввода. Ожидается числовое значение для суммы операции. Примеры допустимых форматов:\n- 1234 (целое число)\n- 567.89 (число с плавающей точкой).'); 
                return;
            }

             
            const transactionCategory = ctx.wizard.state.transactionCategory;
            const formattedAmount = amount.toLocaleString(`ru-Ru`, {minimumFractionDigits: 2, maximumFractionDigits: 2});
            const date = new Date().toISOString().slice(0,10);
    
            const transaction: ITransaction = { 
                userId, 
                amount, 
                category: transactionCategory, 
                date
            }

            ctx.wizard.state.transaction = transaction; 
            ctx.wizard.state.formattedAmount = formattedAmount; 
            await ctx.reply(`Напишите комментарий к операции.\nЕсли он не нужен - используйте кнопку в меню.`, keyboards.cancelCommentKeyboard); 
            return ctx.wizard.next(); 
        }, 

        async (ctx) => { 
            const transaction = ctx.wizard.state.transaction; 
            const comment: string | undefined = ctx.message.text;
            const type: string = ctx.wizard.state.transactionType; 
            const formattedAmount:number = ctx.wizard.state.formattedAmount; 
            const currency: string = ctx.transactionRepository.getUserCurrency(transaction.userId) || "UAH";

            if(comment === '⏩ Продолжить без комментария') { 
                if(type === 'income' )
                ctx.transactionRepository.addIncome(transaction); 
                await ctx.reply(`✅ Операция записана в Категорию: ${transaction.category} \n---------------------- \nСумма: ${formattedAmount} ${currency}. `); 
                await ctx.reply('Хотите записать еще? Тогда выберете категорию, пожалуйста: ', keyboards.incomeCategoriesKeyboard);
            } else if (type ===  'expense') { 
                 ctx.transactionRepository.addExpense(transaction)
                await ctx.reply(`✅ Операция записана в Категорию: ${transaction.category} \n---------------------- \nСумма: ${formattedAmount} ${currency}. `);
                await ctx.reply('Хотите записать еще? Тогда выберете категорию, пожалуйста: ', keyboards.expenseCategoriesKeyboard);
            } else {
                transaction.comment = comment; 
                if(type === 'income' ) {
                ctx.transactionRepository.addIncome(transaction); 
                //await ctx.reply(`✅ Операция записана в Категорию: ${transaction.category} \n---------------------- \n📝 Комментарий: "${transaction.comment}" \nСумма: ${formattedAmount} ${currency}. `); 
                let message = `✅ Операция записана в Категорию: ${transaction.category} \n---------------------- \n📝 Комментарий: "${transaction.comment}" \nСумма: ${formattedAmount} ${currency}. `; 
                await ctx.reply(message, {parse_mode: "Markdown"});
                await ctx.reply('Хотите записать еще? Тогда выберете категорию, пожалуйста: ', keyboards.incomeCategoriesKeyboard);
            } else if (type ===  'expense') { 
                 ctx.transactionRepository.addExpense(transaction)
                let message = (`✅ Операция записана в Категорию: ${transaction.category}  \n---------------------- \n📝 Комментарий: "${transaction.comment}" \nСумма: ${formattedAmount} ${currency}. `);
                await ctx.reply(message, {parse_mode: "Markdown"});
                await ctx.reply('Хотите записать еще? Тогда выберете категорию, пожалуйста: ', keyboards.expenseCategoriesKeyboard);
            }
        }

            delete ctx.wizard.state.transactionCategory; 
            
            return ctx.wizard.selectStep(0);

            }
    )