import { Database, RunResult } from "better-sqlite3"; 

export interface ITransaction { 
    userId: number; 
    amount: number;
    category: string; 
    date: string;
    comment?: string;
}

export interface ITransactionRepository { 
    addIncome(transaction: ITransaction): RunResult
    addExpense(transaction: ITransaction): RunResult; 
    getUserCategories(userId: number, type: `income` | `expense`): string[]; 
    getUserCurrency(userId: number): string | undefined;
    addUserCategory(userId: number, type: 'income' | 'expense', category: string): RunResult;
    removeUserCategory(userId: number, type: 'income' | 'expense', category: string): RunResult; 
    getTotalIncome(userId: number): number; 
    getTotalExpense(userId: number): number; 


}

export class TransactionRepository implements ITransactionRepository {

    private db: Database;
    private insertIncomeStmt: any; 
    private insertExpenseStmt: any;
    private getUserCategoriesStmt: any; 
    private getCurrencyStmt: any; 
    private addUserCategoryStmt: any; 
    private removeUserCategoryStmt: any; 
    private getTotalIncomeStmt: any; 
    private getTotalExpenseStmt: any;
    private viewTransactionDayIncomeStmt: any; 
    private viewTransactionPeriodIncomeStmt: any;
    private viewTransactionDayExpenseStmt: any; 
    private viewTransactionPeriodExpenseStmt: any; 


    constructor(db: Database) {
        this.db = db; 
    
    this.insertIncomeStmt = this.db.prepare(
        `INSERT INTO income (user_id, amount, category, date, comment) VALUES (?, ?, ?, ?, ?)`
    ); 

    this.insertExpenseStmt = this.db.prepare(
        `INSERT INTO expense (user_id, amount, category, date, comment) VALUES (?, ?, ?, ?, ?)`
    ); 

    this.getUserCategoriesStmt = this.db.prepare(
        `SELECT category FROM user_categories WHERE user_id=? AND type=? ORDER BY category`
    ); 

    this.getCurrencyStmt = this.db.prepare(
        `SELECT preferred_currency FROM user_settings WHERE user_id=?`
    ); 

    this.addUserCategoryStmt = this.db.prepare(
        `INSERT INTO user_categories (user_id, type, category) VALUES (?, ?, ?)`
    );

    this.removeUserCategoryStmt = this.db.prepare(
    `DELETE FROM user_categories WHERE user_id=? AND type=? AND category=?`
    );

    this.getTotalIncomeStmt = this.db.prepare(
        `SELECT SUM(amount) AS total FROM income WHERE user_id=?`
    );

    this.getTotalExpenseStmt = this.db.prepare(
        `SELECT SUM(amount) AS total FROM expense WHERE user_id=?`
    );

    this.viewTransactionDayIncomeStmt = this.db.prepare(
        `SELECT amount, category, date FROM income WHERE user_id=? AND date=?`
    );

    this.viewTransactionPeriodIncomeStmt = this.db.prepare(
        `SELECT amount, category, date FROM income WHERE user_id=? AND date BETWEEN ? AND ?`
    );

     this.viewTransactionDayExpenseStmt = this.db.prepare(
        `SELECT amount, category, date FROM expense WHERE user_id=? AND date=?`
    );

    this.viewTransactionPeriodExpenseStmt = this.db.prepare(
        `SELECT amount, category, date FROM expense WHERE user_id=? AND date BETWEEN ? AND ?`
    )
}
    
    addIncome(transaction: ITransaction): RunResult { 
        return this.insertIncomeStmt.run(transaction.userId, transaction.amount, transaction.category, transaction.date, transaction.comment); 
    };

    addExpense(transaction: ITransaction): RunResult { 
        return this.insertExpenseStmt.run(transaction.userId, transaction.amount, transaction.category, transaction.date, transaction.comment); 
    };

    getUserCategories(userId: number, type: `income` | `expense`): string[] {
        const categories = this.getUserCategoriesStmt.all(userId, type) as {category: string }[]; 
        return categories.map(row => row.category); 
    };

    getUserCurrency(userId: number): string | undefined { 
        const currency = this.getCurrencyStmt.get(userId) as {preferred_currency: string} | undefined;
        return currency?.preferred_currency;

    };

    addUserCategory(userId: number, type: 'income' | 'expense', category: string): RunResult { 
        return this.addUserCategoryStmt.run(userId, type, category); 
    };

    removeUserCategory(userId: number, type: 'income' | 'expense', category: string): RunResult {
        return this.removeUserCategoryStmt.run(userId, type, category); 
    };

    getTotalIncome(userId: number) {
        const totalIncome = this.getTotalIncomeStmt.get(userId) as { total: number | null};
        return totalIncome.total ?? 0; 
    };

    getTotalExpense(userId: number) {
        const totalExpense = this.getTotalExpenseStmt.get(userId) as { total: number | null};
        return totalExpense.total ?? 0; 
    };

    viewTransactionIncomeDay(userId: number, date: string): ITransaction[] {
        return this.viewTransactionDayIncomeStmt.all(userId, date) as ITransaction[];
    }; 

    viewTransactionIncomePeriod(userId: number, startDate: string, endDate: string): ITransaction[] { 
        return this.viewTransactionPeriodIncomeStmt.all(userId, startDate, endDate) as ITransaction[]
    };

    viewTransactionExpenseDay(userId: number, date: string): ITransaction[] {
        return this.viewTransactionDayExpenseStmt.all(userId, date) as ITransaction[];
    }; 

    viewTransactionExpensePeriod(userId: number, startDate: string, endDate: string): ITransaction[] { 
        return this.viewTransactionPeriodExpenseStmt.all(userId, startDate, endDate) as ITransaction[]
    };

}
