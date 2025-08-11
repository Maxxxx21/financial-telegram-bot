import { Context as TelegrafContext, Scenes } from "telegraf";
import { TransactionRepository } from "../repositories/TransactionRepository";

export interface MyWizardSessionData extends Scenes.WizardSessionData { 
    transactionType?: 'income' | 'expense'; 
    transactionCategory?: string;
}

export interface MyContext extends TelegrafContext {  
    scene: Scenes.SceneContextScene<MyContext, MyWizardSessionData>;
    wizard: Scenes.WizardContextWizard<MyContext>;
    transactionRepository: TransactionRepository;
}