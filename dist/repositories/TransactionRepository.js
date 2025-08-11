"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TransactionRepository = void 0;
class TransactionRepository {
    constructor(db) {
        this.db = db;
        this.insertIncomeStmt = this.db.prepare(`INSERT INTO income (user_id, amount, category, date, comment) VALUES (?, ?, ?, ?, ?)`);
        this.insertExpenseStmt = this.db.prepare(`INSERT INTO expense (user_id, amount, category, date, comment) VALUES (?, ?, ?, ?, ?)`);
        this.getUserCategoriesStmt = this.db.prepare(`SELECT category FROM user_categories WHERE user_id=? AND type=? ORDER BY category`);
        this.getCurrencyStmt = this.db.prepare(`SELECT preferred_currency FROM user_settings WHERE user_id=?`);
        this.addUserCategoryStmt = this.db.prepare(`INSERT INTO user_categories (user_id, type, category) VALUES (?, ?, ?)`);
        this.removeUserCategoryStmt = this.db.prepare(`DELETE FROM user_categories WHERE user_id=? AND type=? AND category=?`);
        this.getTotalIncomeStmt = this.db.prepare(`SELECT SUM(amount) AS total FROM income WHERE user_id=?`);
        this.getTotalExpenseStmt = this.db.prepare(`SELECT SUM(amount) AS total FROM expense WHERE user_id=?`);
        this.viewTransactionDayIncomeStmt = this.db.prepare(`SELECT amount, category, date FROM income WHERE user_id=? AND date=?`);
        this.viewTransactionPeriodIncomeStmt = this.db.prepare(`SELECT amount, category, date FROM income WHERE user_id=? AND date BETWEEN ? AND ?`);
        this.viewTransactionDayExpenseStmt = this.db.prepare(`SELECT amount, category, date FROM expense WHERE user_id=? AND date=?`);
        this.viewTransactionPeriodExpenseStmt = this.db.prepare(`SELECT amount, category, date FROM expense WHERE user_id=? AND date BETWEEN ? AND ?`);
    }
    addIncome(transaction) {
        return this.insertIncomeStmt.run(transaction.userId, transaction.amount, transaction.category, transaction.date, transaction.comment);
    }
    ;
    addExpense(transaction) {
        return this.insertExpenseStmt.run(transaction.userId, transaction.amount, transaction.category, transaction.date, transaction.comment);
    }
    ;
    getUserCategories(userId, type) {
        const categories = this.getUserCategoriesStmt.all(userId, type);
        return categories.map(row => row.category);
    }
    ;
    getUserCurrency(userId) {
        const currency = this.getCurrencyStmt.get(userId);
        return currency?.preferred_currency;
    }
    ;
    addUserCategory(userId, type, category) {
        return this.addUserCategoryStmt.run(userId, type, category);
    }
    ;
    removeUserCategory(userId, type, category) {
        return this.removeUserCategoryStmt.run(userId, type, category);
    }
    ;
    getTotalIncome(userId) {
        const totalIncome = this.getTotalIncomeStmt.get(userId);
        return totalIncome.total ?? 0;
    }
    ;
    getTotalExpense(userId) {
        const totalExpense = this.getTotalExpenseStmt.get(userId);
        return totalExpense.total ?? 0;
    }
    ;
    viewTransactionIncomeDay(userId, date) {
        return this.viewTransactionDayIncomeStmt.all(userId, date);
    }
    ;
    viewTransactionIncomePeriod(userId, startDate, endDate) {
        return this.viewTransactionPeriodIncomeStmt.all(userId, startDate, endDate);
    }
    ;
    viewTransactionExpenseDay(userId, date) {
        return this.viewTransactionDayExpenseStmt.all(userId, date);
    }
    ;
    viewTransactionExpensePeriod(userId, startDate, endDate) {
        return this.viewTransactionPeriodExpenseStmt.all(userId, startDate, endDate);
    }
    ;
}
exports.TransactionRepository = TransactionRepository;
