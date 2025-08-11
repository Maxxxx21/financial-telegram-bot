"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.database = void 0;
const better_sqlite3_1 = __importDefault(require("better-sqlite3"));
const path_1 = __importDefault(require("path"));
const dbPath = path_1.default.join(__dirname, "..", "..", 'finance.db');
exports.database = new better_sqlite3_1.default(dbPath, { verbose: console.log });
try {
    exports.database.exec(`
        BEGIN;

        CREATE TABLE IF NOT EXISTS income(
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            amount REAL NOT NULL,
            category TEXT,
            comment TEXT,
            date TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS expense(
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            amount REAL NOT NULL,
            category TEXT,
            comment TEXT,
            date TEXT NOT NULL
        );


        CREATE TABLE IF NOT EXISTS user_categories(
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            type TEXT NOT NULL,
            category TEXT,
            comment TEXT,
            UNIQUE(user_id, type, category)
        );    
        
        CREATE TABLE IF NOT EXISTS user_settings(
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            preferred_currency TEXT NOT NULL DEFAULT 'UAH'
        );

        COMMIT;
    `);
    console.log(`Tables have been created.`);
}
catch (err) {
    console.error('There is some troubles with creating tables.', err.message);
    process.exit(1);
}
