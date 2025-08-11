import Database from "better-sqlite3"; 
import path from "path"; 

const dbPath = path.join(__dirname, "..", "..", 'finance.db'); 
export const database = new Database(dbPath, { verbose: console.log}); 

try { 
    database.exec(`
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
} catch(err) { 
console.error('There is some troubles with creating tables.', (err as Error).message);
process.exit(1);
}




