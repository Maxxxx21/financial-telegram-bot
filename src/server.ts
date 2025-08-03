import { Markup, Telegraf, session, Context as TelegrafContext, Scenes } from "telegraf";
import Database from "better-sqlite3"; 
import "dotenv/config"

interface MySession extends Scenes.WizardSession { 
    transactionType?: 'income' | 'expense'; 
    transactionCategory?: string; 
}

interface MyWizardSessionData extends Scenes.WizardSessionData { 
    transactionType?: 'income' | 'expense'; 
    transactionCategory?: string;
}

interface MyContext extends TelegrafContext { 
    session: MySession; 
    scene: Scenes.SceneContextScene<MyContext, MyWizardSessionData>;
    wizard: Scenes.WizardContextWizard<MyContext>;
}

const token = process.env["BOT_TOKEN"] as string;

if(!token) { 
    console.error("There is some problems with starting Bot.")
    process.exit(1); 
}

const bot = new Telegraf<MyContext>(token);
console.log('Bot starting...!'); 

const db = new Database('finance.db',{verbose: console.log}); 
try { 
    db.exec(`CREATE TABLE IF NOT EXISTS income(
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        amount REAL NOT NULL,
        category TEXT,
        date TEXT NOT NULL
        );
`);
    console.log('table income created.');

   db.exec(`
    CREATE TABLE IF NOT EXISTS expense( 
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      amount REAL NOT NULL,
      category TEXT,
      date TEXT NOT NULL
    );
`);
    console.log('table expense created.');
} catch(err) { 
    console.error("Troubles with database:", err.message); 
    process.exit(1); 
}

const insertIncomeStmt = db.prepare(`
        INSERT INTO income (user_id, amount, category, date) VALUES (?, ?, ?, ?)
    `);
    
const insertExpenseStmt = db.prepare(`
        INSERT INTO expense (user_id, amount, category, date) VALUES (?, ?, ?, ?)
    `);

const amountInput = new Scenes.WizardScene<MyContext>(
        `amountInputScene`, 
    async (ctx) => { 
            
         if( ctx.session.transactionCategory && ctx.session.transactionType) { 
                ctx.wizard.state.transactionCategory = ctx.session.transactionCategory; 
                ctx.wizard.state.transactionType = ctx.session.transactionType;

            await ctx.reply('Введите сумму операции: ');
            return ctx.wizard.next(); 
             }
        },

        async (ctx) => { 
            const amountText: string | undefined = ctx.message?.text;
            const userId: number = ctx.from.id;
            const date = new Date().toISOString().slice(0,10); 

            if(!amountText) {
                await ctx.reply('Мы не можем обработать пустое поле. Введите сумму Вашей транзакции: ');
                return
            }

            const amount: number = parseFloat(amountText);
            if(isNaN(amount)) { 
                await ctx.reply('⛔️ Ошибка ввода. Ожидается числовое значение для суммы операции. Примеры допустимых форматов:\n- 1234 (целое число)\n- 567.89 (число с плавающей точкой).'); 
                return;
            }

            const transactionType = ctx.wizard.state.transactionType; 
            const transactionCategory = ctx.wizard.state.transactionCategory;
            

            if(transactionType === "income") {
                insertIncomeStmt.run(userId, amount, transactionCategory, date); 
                await ctx.reply(`✅ Операция записана в Категорию: ${transactionCategory} \nСумма: ${amount.toFixed(2)} UAH. `); 
                await ctx.reply('Хотите записать еще? Тогда выберете категорию, пожалуйста: ', incomeCategoriesKeyboard);
            } else if ( transactionType === "expense") {
                insertExpenseStmt.run(userId, amount, transactionCategory, date);
                await ctx.reply(`✅ Операция записана в Категорию: ${transactionCategory} \nСумма: ${amount.toFixed(2)} UAH. `);
                await ctx.reply('Хотите записать еще? Тогда выберете категорию, пожалуйста: ', expenseCategoriesKeyboard);
            }

            return ctx.scene.leave(); 

        }
    )

    const stage = new Scenes.Stage<MyContext>([amountInput]); 

    bot.use(session()); 
    bot.use(stage.middleware()); 


      bot.start((ctx: MyContext) => { 
        let username: string = ctx.from.username || ctx.from.first_name; 
        ctx.reply(
            `Привет, ${username}! Давай запишем твои финансовые операциию. В какую сферу будем вносить данные?`, 
                Markup.keyboard([
                    ['📈 Доходы', '📉 Расходы'],
                    ['💸 Баланс']
                ]).resize().oneTime()
        )
    }); 

    bot.hears('📈 Доходы', async (ctx: MyContext) => {
        const userId = ctx.from.id; 
        const incomeResult: unknown = db.prepare(`SELECT SUM(amount) AS total FROM income WHERE user_id=?`).get(userId);
        const totalIncome: number = incomeResult.total || 0; 

        ctx.session.transactionType = "income";
        await ctx.reply(`💰 Ваш общий доход: ${totalIncome.toFixed(2)}. \nВыберете категорию дохода: `, incomeCategoriesKeyboard);
    }); 

    bot.hears('📉 Расходы', async(ctx: MyContext) => { 
        const userId = ctx.from.id; 
        const expenseResult: unknown = db.prepare(`SELECT SUM(amount) AS total FROM expense WHERE user_id=?`).get(userId); 
        const totalExpense: number = expenseResult.total || 0;

        ctx.session.transactionType = "expense"; 

        await ctx.reply(`💰 Ваши общие расходы: -${totalExpense.toFixed(2)}. \nВыберете категорию расходов: `, expenseCategoriesKeyboard)

    }); 

    const incomeCategories = ['💰 Зарплата', '💻 Фриланс','📈 Инвестиции', '🎁 Подарки','➕ Другое'];
    incomeCategories.forEach((category) => {
        bot.hears(category, async (ctx: MyContext) => { 
            if(ctx.session.transactionType === 'income'){ 
                ctx.session.transactionCategory = category; 
                return ctx.scene.enter('amountInputScene');
            } else { 
                await ctx.reply('Пожалуйста, сначала выберете категорию "Доходы", затем уже категорию.')
            }
        })
    })

     const expenseCategories  =['🍔 Еда', '🚌 Транспорт','🏠 Жилье', '💡 Коммунальные платежи','👕 Одежда', '🏥 Здоровье','🚗 Машина'];
    expenseCategories.forEach((category) => {
        bot.hears(category, async (ctx: MyContext) => { 
            if(ctx.session.transactionType === 'expense'){ 
                ctx.session.transactionCategory = category; 
                return ctx.scene.enter('amountInputScene');
            } else { 
                await ctx.reply('Пожалуйста, сначала выберете категорию "Расходы", затем уже категорию.')
            }
        })
    })

    bot.hears('💸 Баланс', async (ctx: MyContext) => { 
        console.log("debug в кнопку баланс");
        const userId = ctx.from.id;

        const incomeResult: unknown = db.prepare(`SELECT SUM(amount) AS total FROM income WHERE user_id=?`).get(userId);
        const totalIncome: number = incomeResult.total || 0; 

        const expenseResult: unknown = db.prepare(`SELECT SUM(amount) AS total FROM expense WHERE user_id=?`).get(userId); 
        const totalExpense: number = expenseResult.total || 0;

        const currentBalance = totalIncome - totalExpense; 

        let message: string = `💰 Ваш текущий баланс:\n`; 
        message += `Доходы: ${totalIncome.toFixed(2)} UAH\n`;
        message += `Расходы: -${totalExpense.toFixed(2)} UAH\n`;
        message += `-----------------------------------------\n`;
        message += `Текущий баланс: ${currentBalance} UAH.`
        ctx.reply(message); 

    })

    const incomeCategoriesKeyboard = Markup.keyboard([
        ['💰 Зарплата', '💻 Фриланс'],
        ['📈 Инвестиции', '🎁 Подарки'],
        ['➕ Другое', '↩️ Назад'],
        ['💸 Баланс']
    ]).resize().oneTime();

    const expenseCategoriesKeyboard = Markup.keyboard([
        ['🍔 Еда', '🚌 Транспорт'],
        ['🏠 Жилье', '💡 Коммунальные платежи'],
        ['👕 Одежда', '🏥 Здоровье'],
        ['🚗 Машина', '↩️ Назад'],
        ['💸 Баланс']
    ]).resize().oneTime();

    const handleClickCancel = async(ctx: MyContext) => { 
        if(ctx.scene.current) {
            await ctx.reply("Действие успешно отменено.")
            delete ctx.wizard.state;
            return ctx.scene.leave(); 
        } else {
            await ctx.reply('В данный момент нет активных операций.')
            delete ctx.session.transactionCategory;
            delete ctx.session.transactionType;

            await ctx.reply(`Что будем записывать ?`,
                Markup.keyboard([
                    ['📈 Доходы', '📉 Расходы'],
                    ['💸 Баланс']
                ]).resize().oneTime()
            )
        }
    }

    bot.hears('↩️ Назад',handleClickCancel);

    bot.launch();

  



