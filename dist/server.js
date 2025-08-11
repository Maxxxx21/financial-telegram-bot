"use strict";
// import { Markup, Telegraf, session, Context as TelegrafContext, Scenes } from "telegraf";
// import Database from "better-sqlite3"; 
// import "dotenv/config"
// interface MySession extends Scenes.WizardSession { 
//     transactionType?: 'income' | 'expense'; 
//     transactionCategory?: string; 
// }
// interface MyWizardSessionData extends Scenes.WizardSessionData { 
//     transactionType?: 'income' | 'expense'; 
//     transactionCategory?: string;
// }
// interface MyContext extends TelegrafContext { 
//     session: MySession; 
//     scene: Scenes.SceneContextScene<MyContext, MyWizardSessionData>;
//     wizard: Scenes.WizardContextWizard<MyContext>;
// }
// const token = process.env["BOT_TOKEN"] as string;
// if(!token) { 
//     console.error("There is some problems with starting Bot.")
//     process.exit(1); 
// }
// const bot = new Telegraf<MyContext>(token);
// console.log('Bot starting...!'); 
// const db = new Database('finance.db',{verbose: console.log}); 
// try { 
//     db.exec(`CREATE TABLE IF NOT EXISTS income(
//         id INTEGER PRIMARY KEY AUTOINCREMENT,
//         user_id INTEGER NOT NULL,
//         amount REAL NOT NULL,
//         category TEXT,
//         date TEXT NOT NULL
//         );
// `);
//    db.exec(`CREATE TABLE IF NOT EXISTS expense( 
//         id INTEGER PRIMARY KEY AUTOINCREMENT,
//         user_id INTEGER NOT NULL,
//         amount REAL NOT NULL,
//         category TEXT,
//         date TEXT NOT NULL
//         );
// `);
//     db.exec(`CREATE TABLE IF NOT EXISTS user_categories(
//         id INTEGER PRIMARY KEY AUTOINCREMENT,
//         user_id INTEGER NOT NULL,
//         type TEXT NOT NULL,
//         category TEXT,
//         UNIQUE(user_id, type, category)
//         );    
//     `);  
//     db.exec(`CREATE TABLE IF NOT EXISTS user_settings(
//         id INTEGER PRIMARY KEY AUTOINCREMENT,        
//         user_id INTEGER NOT NULL,
//         preferred_currency TEXT NOT NULL DEFAULT 'UAH'
//         ); 
//     `); 
//     console.log('table income created.');
//     console.log('table expense created.');
//     console.log(`table user_categories created.`);
//     console.log(`table user_currency created.`); 
// } catch(err) { 
//     console.error("Troubles with database:", err.message); 
//     process.exit(1); 
// }
// const insertIncomeStmt = db.prepare(`
//         INSERT INTO income (user_id, amount, category, date) VALUES (?, ?, ?, ?)
//     `);
// const insertExpenseStmt = db.prepare(`
//         INSERT INTO expense (user_id, amount, category, date) VALUES (?, ?, ?, ?)
//     `);
// const addUserCategoryStmt = db.prepare(`
//     INSERT INTO user_categories (user_id, type, category) VALUES (?, ?, ?)
//     `);   
// const removeUserCategoryStmt = db.prepare(`
//     DELETE FROM user_categories WHERE user_id=? AND type=? AND category=?
//     `);
// const getUserCategoriesStmt = db.prepare(`
//     SELECT category FROM user_categories WHERE user_id=? AND type=? ORDER BY category
//     `); 
// const insertCurrencyStmt = db.prepare(`
//     INSERT OR REPLACE INTO user_settings (user_id, preferred_currency) VALUES (?, ?)
//     `); 
// const getCurrencyStmt = db.prepare(`
//     SELECT preferred_currency FROM user_settings WHERE user_id=?
//     `); 
// async function getUserCategories(userId: number, type: 'income' | 'expense'): Promise<string[]>{ 
//     const categories = getUserCategoriesStmt.all(userId, type); 
//     return categories.map((row:any) => row.category); 
// }   
// async function getUserCurrency(userId: number): Promise<string> { 
//     const currency = getCurrencyStmt.get(userId); 
//     return currency ? currency.preferred_currency : "UAH";
// }
// // --- Keyboards ---
//  const startKeyboard = Markup.keyboard([
//         ['✍️ Записать', '👀 Просмотреть'],
//         ['💸 Баланс', '⚙️ Редактировать интерфейс']
//     ]).resize().oneTime();
//     const mainCategoriesKeyboard = Markup.keyboard([
//         ['📈 Доходы', '📉 Расходы'],
//         ['💸 Баланс', '↩️ Назад']
//     ]).resize().oneTime(); 
//     const setUpInterfaceKeyboard =  Markup.keyboard([
//         ['➕ Добавить категорию', '➖ Удалить категорию'],
//         ['💱 Смена Валюты',  '↩️ Назад']
//     ]);
//     const selectCurrencyKeyboard = Markup.keyboard([
//         ['UAH', 'USD'],
//         ['EUR', 'GBP'],
//         ['Ваша валюты', '↩️ Назад']
//     ]);
//     const incomeCategoriesKeyboard = Markup.keyboard([
//         ['💰 Зарплата', '💻 Фриланс'],
//         ['📈 Инвестиции', '🎁 Подарки'],
//         ['➕ Другое', '↩️ Назад'],
//         ['💸 Баланс']
//     ]).resize().oneTime();
//     const expenseCategoriesKeyboard = Markup.keyboard([
//         ['🍔 Еда', '🚌 Транспорт'],
//         ['🏠 Жилье', '💡 Коммунальные платежи'],
//         ['👕 Одежда', '🏥 Здоровье'],
//         ['🚗 Машина', '↩️ Назад'],
//         ['💸 Баланс']
//     ]).resize().oneTime();
// // --- Scene №1 Reacord Transaction ---
// const recordTransaction = new Scenes.WizardScene<MyContext>(
//         `recordTransactionScene`, 
//     async (ctx) => {
//         await ctx.reply(`Что будем записывать?`, mainCategoriesKeyboard); 
//         return ctx.wizard.next(); 
//         },
//         async(ctx) => { 
//             const userId: number = ctx.from?.id;
//             const type = (ctx.message as any)?.text; 
//             if (type === '📈 Доходы') { 
//                 ctx.wizard.state.transactionType = "income";
//                 const incomeResult: unknown = db.prepare(`SELECT SUM(amount) AS total FROM income WHERE user_id=?`).get(userId);
//                 const totalIncome: number = incomeResult.total || 0;
//                 const formattedTotalIncome: string = totalIncome.toLocaleString(`ru-RU`, {minimumFractionDigits: 2, maximumFractionDigits: 2});
//                 await ctx.reply(`💰 Ваш общий доход: ${formattedTotalIncome} UAH. \nВыберете категорию дохода: `, incomeCategoriesKeyboard);
//                 return ctx.wizard.next(); 
//             } else if(type === '📉 Расходы') {
//                 ctx.wizard.state.transactionType = "expense";
//                 const expenseResult: unknown = db.prepare(`SELECT SUM(amount) AS total FROM expense WHERE user_id=?`).get(userId);
//                 const totalExpense: number = expenseResult.total || 0;
//                 const formattedTotalExpense = totalExpense.toLocaleString(`ru-RU`, {minimumFractionDigits: 2, maximumFractionDigits: 2});
//                 await ctx.reply(`💰 Ваш общие расходы: ${formattedTotalExpense} UAH. \nВыберете категорию дохода: `, expenseCategoriesKeyboard);
//                 return ctx.wizard.next();
//             } else if (type ==='↩️ Назад') {
//                 await ctx.reply(`Возвращаемся назад.`)
//                 await ctx.reply(`Что делаем?`, startKeyboard);
//                 return ctx.scene.leave(); 
//             } else if (type === '💸 Баланс') { 
//                 await ctx.scene.leave(); 
//                 return ctx.scene.enter(`showBalanceScene`);  
//             }
//         }, 
//         async(ctx) => { 
//             const incomeCategories:string[] = ['💰 Зарплата', '💻 Фриланс','📈 Инвестиции', '🎁 Подарки','➕ Другое'];
//             const expenseCategories: string[]  =['🍔 Еда', '🚌 Транспорт','🏠 Жилье', '💡 Коммунальные платежи','👕 Одежда', '🏥 Здоровье','🚗 Машина']; 
//             const inputCategory: string  = ctx.message.text; 
//             const isIncomeCategory = incomeCategories.includes(inputCategory); 
//             const isExpenseCategory = expenseCategories.includes(inputCategory); 
//             if(isIncomeCategory) {
//                 ctx.wizard.state.transactionCategory = inputCategory;
//                 await ctx.reply(`Введите сумму операции: `);
//                 return ctx.wizard.next(); 
//             } else if (isExpenseCategory) { 
//                 ctx.wizard.state.transactionCategory = inputCategory; 
//                 await ctx.reply(`Введите сумму операции: `);
//                 return ctx.wizard.next();
//             } else if (inputCategory === '↩️ Назад') {
//                 await ctx.reply(`Что будем записывать?`, mainCategoriesKeyboard); 
//                 return ctx.wizard.selectStep(1); 
//             } else if (inputCategory === '💸 Баланс') { 
//                 await ctx.scene.leave(); 
//                 return ctx.scene.enter(`showBalanceScene`); 
//             }
//         },
//         async (ctx) => { 
//             const amountText: string | undefined = ctx.message?.text;
//             const userId: number = ctx.from.id;
//             const date = new Date().toISOString().slice(0,10);
//             if(amountText === '↩️ Назад') { 
//                 await ctx.reply(`Возвразаемся назад.`);
//                 return ctx.wizard.selectStep(2); 
//             }
//             if ( amountText === '💸 Баланс') { 
//                 await ctx.scene.leave(); 
//                 return ctx.scene.enter(`showBalanceScene`); 
//             }
//             if(!amountText) {
//                 await ctx.reply('Мы не можем обработать пустое поле. Введите сумму Вашей транзакции: ');
//                 return
//             }
//             const amount: number = parseFloat(amountText);
//             if(isNaN(amount)) { 
//                 await ctx.reply('⛔️ Ошибка ввода. Ожидается числовое значение для суммы операции. Примеры допустимых форматов:\n- 1234 (целое число)\n- 567.89 (число с плавающей точкой).'); 
//                 return;
//             }
//             const transactionType = ctx.wizard.state.transactionType; 
//             const transactionCategory = ctx.wizard.state.transactionCategory;
//             const formattedAmount = amount.toLocaleString(`ru-Ru`, {minimumFractionDigits: 2, maximumFractionDigits: 2}); 
//             if(transactionType === "income") {
//                 insertIncomeStmt.run(userId, amount, transactionCategory, date); 
//                 await ctx.reply(`✅ Операция записана в Категорию: ${transactionCategory} \nСумма: ${formattedAmount} UAH. `); 
//                 await ctx.reply('Хотите записать еще? Тогда выберете категорию, пожалуйста: ', incomeCategoriesKeyboard);
//             } else if ( transactionType === "expense") {
//                 insertExpenseStmt.run(userId, amount, transactionCategory, date);
//                 await ctx.reply(`✅ Операция записана в Категорию: ${transactionCategory} \nСумма: ${formattedAmount} UAH. `);
//                 await ctx.reply('Хотите записать еще? Тогда выберете категорию, пожалуйста: ', expenseCategoriesKeyboard);
//             } 
//             delete ctx.wizard.state.transactionCategory; 
//             return ctx.wizard.selectStep(2);
//         })
//     // --- Scene №2 Calculate Transaction ---
// const calculateTransaction = new Scenes.WizardScene<MyContext>(
//     `calculationScene`, 
//     async(ctx) => {
//         await ctx.reply(`Какую категорию будем смотреть?`, mainCategoriesKeyboard)
//         return ctx.wizard.next();
//     }, 
//     async(ctx) => { 
//        const type = ctx.message.text as any; 
//        if(type === '📈 Доходы' ) { 
//         ctx.wizard.state.transactionType = 'income';
//        } else if (type === '📉 Расходы') {
//         ctx.wizard.state.transactionType = 'expense'; 
//        } else if (type === '↩️ Назад') { 
//         await ctx.reply('Что будем записывать ?', startKeyboard);
//         return ctx.scene.leave();
//        } else if (type === '💸 Баланс') { 
//             await ctx.scene.leave(); 
//             return ctx.scene.enter(`showBalanceScene`); 
//         } else { 
//         await ctx.reply('Пожалуйста, выберите "Доходы" или "Расходы"');
//        }
//        await ctx.reply(`Укажите, пожалуйста, желаемую дату или период в формате: \n- **2025-11-29** (для одной даты)\n- **2025-11-01/2025-11-30** (для периода)`, {parse_mode: "Markdown"});
//        return ctx.wizard.next();  
//     }, 
//     async(ctx) => { 
//         const dateOrPeriodInput: any = (ctx.message as any)?.text;
//         const userId: number = ctx.from.id; 
//         const transactionType: string = ctx.wizard.state.transactionType; 
//         if(!transactionType) {
//             await ctx.reply(`Произошла ошибка. Начните, пожалуйста, процесс заново.`, startKeyboard);
//             return ctx.scene.leave(); 
//         }
//         if (dateOrPeriodInput === '↩️ Назад') { 
//             await ctx.reply('Что будем записывать?', startKeyboard);
//         return ctx.wizard.selectStep(1);
//         }
//         const date = /^\d{4}-\d{2}-\d{2}$/;
//         const period = /^\d{4}-\d{2}-\d{2}\/\d{4}-\d{2}-\d{2}$/;
//         let query  = ``; 
//         let params = [userId]
//         if(date.test(dateOrPeriodInput)) { 
//             query  = `SELECT amount, category, date FROM ${transactionType} WHERE user_id=? AND date=?`; 
//             params.push(dateOrPeriodInput); 
//         } else if (period.test(dateOrPeriodInput)) { 
//             const [startDate, endDate] = dateOrPeriodInput.split('/');
//             query  = `SELECT amount, category, date FROM ${transactionType} WHERE user_id=? AND date BETWEEN ? AND ?`; 
//             params.push(startDate, endDate);  
//         } else {
//             await ctx.reply('Неверный формат. Пожалуйста, введите дату или период в формате: \n- **2025-11-29**\n- **2025-11-01/2025-11-30**', {parse_mode: 'Markdown'});
//             return; 
//         }
//         const transactions = db.prepare(query).all(...params); 
//         let message = `**Ваши ${transactionType === 'income' ? 'доходы' : 'расходы'}:**\n\n`; 
//         if(transactions.length === 0) {
//             message += `Нет данных за указанный период`;
//         } else { 
//             transactions.forEach((t: any) => { 
//                 message += `${t.date} | ${t.category}: ${t.amount.toFixed(2)} UAH\n`
//             });
//         }
//         await ctx.reply(message, {parse_mode: "Markdown"}); 
//         await ctx.reply('Что будем делать дальше?',startKeyboard)
//         return ctx.scene.leave(); 
//     }
// )
//     // --- Scene №3 ---- Showing the actual balance
//      const showBalance = new Scenes.WizardScene<MyContext> (
//         `showBalanceScene`, 
//         async (ctx) => { 
//             const userId = ctx.from.id;
//             const incomeResult: unknown = db.prepare(`SELECT SUM(amount) AS total FROM income WHERE user_id=?`).get(userId);
//             const totalIncome: number = incomeResult.total || 0;
//             const formattedTotalIncome = totalIncome.toLocaleString(`ru-RU`, {minimumFractionDigits: 2, maximumFractionDigits: 2})
//             const expenseResult: unknown = db.prepare(`SELECT SUM(amount) AS total FROM expense WHERE user_id=?`).get(userId); 
//             const totalExpense: number = expenseResult.total || 0;
//             const formattedTotalExpense = totalExpense.toLocaleString(`ru-RU`, {minimumFractionDigits: 2, maximumFractionDigits: 2});
//             const currentBalance = totalIncome - totalExpense; 
//             const formattedCurrentBalance = currentBalance.toLocaleString(`ru-RU`, {minimumFractionDigits: 2, maximumFractionDigits: 2});
//             let message: string = `💰 Ваш текущий баланс:\n`; 
//             message += `Доходы: ${formattedTotalIncome} UAH\n`;
//             message += `Расходы: -${formattedTotalExpense} UAH\n`;
//             message += `-----------------------------------------\n`;
//             message += `Текущий баланс: ${formattedCurrentBalance} UAH.`
//             ctx.reply(message); 
//             await ctx.reply(`What we gona do?`, startKeyboard); 
//             return ctx.wizard.next(); 
//         }, 
//         async (ctx) => {
//             const type: string = ctx.message?.text;
//             if(type === '👀 Просмотреть')  { 
//                 await ctx.scene.leave(); 
//                 return ctx.scene.enter(`calculationScene`);
//             } else if (type === '✍️ Записать') { 
//                 await ctx.scene.leave(); 
//                 return ctx.scene.enter(`recordTransactionScene`);
//     }
//     }
// ); 
//  // --- Scene №4 Set up Interface ---
// const interface = new Scenes.WizardScene<MyContext> (
//     `interfaceScene`, 
//     async (ctx) => { 
//         await ctx.reply(`Выберете действие: `, setUpInterfaceKeyboard); 
//         return ctx.wizard.next(); 
//     }, 
//     async (ctx) => { 
//         const type:string = ctx.message?.text; 
//         if(type === '➕ Добавить категорию') {
//             await ctx.reply(`Необходимо выбрать тип операций: `, mainCategoriesKeyboard); 
//         } else if (type === '➖ Удалить категорию') { 
//             await ctx.reply(`Необходимо выбрать тип операций: `, mainCategoriesKeyboard);
//         } else if (type === '💸 Баланс') { 
//             await ctx.scene.leave(); 
//             return ctx.scene.enter(`showBalanceScene`);
//         } else if (type === '↩️ Назад') {
//             return ctx.wizard.back(); 
//         }
//         return ctx.wizard.next(); 
//     }, 
//     async (ctx) => { 
//         const type: string = ctx.message?.text;
//         let tableType:string; 
//         if(type === '📈 Доходы') {
//             tableType = 'income'
//         } else if (type = '📉 Расходы') { 
//             tableType = `expense`;     //db.prepare(`SELECT SUM(amount) AS total FROM expense WHERE user_id=?`).get(userId);
//         }
//         const showCategoriesMessage = db.prepare(`SELECT category`)
//     }
// )   
// // const mainCategoriesKeyboard = Markup.keyboard([
// //         ['📈 Доходы', '📉 Расходы'],
// //         ['💸 Баланс', '↩️ Назад']
// //     ]).resize().oneTime(); 
// //     const setUpInterfaceKeyboard =  Markup.keyboard([
// //         ['➕ Добавить категорию', '➖ Удалить категорию'],
// //         ['💱 Смена Валюты',  '↩️ Назад']
// //     ]);
//     const stage = new Scenes.Stage<MyContext>([recordTransaction, calculateTransaction, showBalance]); 
//     bot.use(session()); 
//     bot.use(stage.middleware());  
//     const handleClickCancel = async(ctx: MyContext) => { 
//         if(ctx.scene.current) {
//             const stepNumber = ctx.wizard.cursor; 
//             if(stepNumber > 0) { 
//                 await ctx.reply(`🔙 Возвращаемся назад.`)
//                 return ctx.wizard.back(); 
//             } else {
//                 await ctx.reply(`↩️ Действие успешно отменено.`, startKeyboard);
//                 return ctx.scene.leave();
//             }
//         } else {
//             await ctx.reply('В данный момент нет активных операций.')
//             delete ctx.session.transactionCategory;
//             delete ctx.session.transactionType;
//             await ctx.reply(`Что будем %%% ?`, startKeyboard
//             )
//         }
//     }
//      // --- Handle bot commands  ---
//  bot.start((ctx: MyContext) => {
//         let username: string = ctx.from?.username || ctx.from?.first_name; 
//         ctx.reply(`
//             Привет, ${username}! Выбери, что ты сейчас хочешь сделать с операцией:
//             `, startKeyboard
//         )
//     })
//     bot.hears('👀 Просмотреть', async(ctx: MyContext) => { 
//         return ctx.scene.enter(`calculationScene`);
//     })
//     bot.hears('✍️ Записать', async(ctx: MyContext) => { 
//         return ctx.scene.enter(`recordTransactionScene`);
//     })
//     bot.hears('↩️ Назад',handleClickCancel);
//     bot.hears('💸 Баланс', showBalance);
//     bot.launch();
