import fs from 'fs';
import path from 'path';
import slug from 'slug';
import inquirer from 'inquirer';
import ExitCodes from '../ExitCodes';
import { CLIError } from '@oclif/errors';
import { Command } from '@oclif/command';
import { Keyring } from '@polkadot/api';
import { KeyringPair$Json, KeyringPair } from '@polkadot/keyring/types';
import Api from '../Api';
import { formatBalance } from '@polkadot/util';
import { AccountBalances, NamedKeyringPair } from '../Types';

type StateObject = { selectedAccountFilename: string };

export default abstract class AccountsCommandBase extends Command {
    static ACCOUNTS_DIRNAME = '/accounts';
    static STATE_FILE = '/state.json';
    private api: Api | null = null;

    getApi(): Api {
        if (!this.api) throw new CLIError('Tried to get API before initialization.', { exit: ExitCodes.ApiError });
        return this.api;
    }

    getAccountsDirPath(): string {
        return path.join(this.config.dataDir, AccountsCommandBase.ACCOUNTS_DIRNAME);
    }

    getAccountFilePath(account: NamedKeyringPair): string {
        return path.join(this.getAccountsDirPath(), this.generateAccountFilename(account));
    }

    generateAccountFilename(account: NamedKeyringPair): string {
        return `${ slug(account.meta.name, '_') }__${ account.address }.json`;
    }

    getStateFilePath(): string {
        return path.join(this.config.dataDir, AccountsCommandBase.STATE_FILE);
    }

    private createDataReadError(): CLIError {
        return new CLIError(
            `Unexpected error while trying to read from the data directory (${this.config.dataDir})! Permissions issue?`,
            { exit: ExitCodes.FsOperationFailed }
        );
    }

    private createDataWriteError(): CLIError {
        return new CLIError(
            `Unexpected error while trying to write into the data directory (${this.config.dataDir})! Permissions issue?`,
            { exit: ExitCodes.FsOperationFailed }
        );
    }

    private initDataDir(): void {
        const initialState: StateObject = { selectedAccountFilename: '' };
        if (!fs.existsSync(this.config.dataDir)) {
            fs.mkdirSync(this.config.dataDir);
        }
        if (!fs.existsSync(this.getAccountsDirPath())) {
            fs.mkdirSync(this.getAccountsDirPath());
        }
        if (!fs.existsSync(this.getStateFilePath())) {
            fs.writeFileSync(this.getStateFilePath(), JSON.stringify(initialState));
        }
    }

    saveAccount(account: NamedKeyringPair, password: string): void {
        try {
            fs.writeFileSync(this.getAccountFilePath(account), JSON.stringify(account.toJson(password)));
        } catch(e) {
            throw this.createDataWriteError();
        }
    }

    fetchAccountFromJsonFile(jsonBackupFilePath: string): NamedKeyringPair {
        if (!fs.existsSync(jsonBackupFilePath)) {
            throw new CLIError('Input file does not exist!', { exit: ExitCodes.FileNotFound });
        }
        if (path.extname(jsonBackupFilePath) !== '.json') {
            throw new CLIError('Invalid input file: File extension should be .json', { exit: ExitCodes.InvalidFile });
        }
        let accountJsonObj: any;
        try {
            accountJsonObj = require(jsonBackupFilePath);
        } catch (e) {
            throw new CLIError('Provided backup file is not valid or cannot be accessed', { exit: ExitCodes.InvalidFile });
        }
        if (typeof accountJsonObj !== 'object' || accountJsonObj === null) {
            throw new CLIError('Provided backup file is not valid', { exit: ExitCodes.InvalidFile });
        }

        // Force some default account name if none is provided in the original backup
        if (!accountJsonObj.meta) accountJsonObj.meta = {};
        if (!accountJsonObj.meta.name) accountJsonObj.meta.name = 'Unnamed Account';

        let keyring = new Keyring();
        let account:NamedKeyringPair;
        try {
            // Try adding and retrieving the keys in order to validate that the backup file is correct
            keyring.addFromJson(accountJsonObj);
            account = <NamedKeyringPair> keyring.getPair(accountJsonObj.address); // We can be sure it's named, because we forced it before
        } catch (e) {
            throw new CLIError('Provided backup file is not valid', { exit: ExitCodes.InvalidFile });
        }

        return account;
    }

    private fetchAccountOrNullFromFile(jsonFilePath: string): NamedKeyringPair | null {
        try {
            return this.fetchAccountFromJsonFile(jsonFilePath);
        } catch (e) {
            // Here in case of a typical CLIError we just return null (otherwise we throw)
            if (!(e instanceof CLIError)) throw e;
            return null;
        }
    }

    fetchAccounts(): NamedKeyringPair[] {
        let files: string[] = [];
        const accountDir = this.getAccountsDirPath();
        try {
            files = fs.readdirSync(accountDir);
        }
        catch(e) {
        }

        // We have to assert the type, because TS is not aware that we're filtering out the nulls at the end
        return <NamedKeyringPair[]> files
            .map(fileName => {
                const filePath = path.join(accountDir, fileName);
                return this.fetchAccountOrNullFromFile(filePath);
            })
            .filter(accObj => accObj !== null);
    }

    // TODO: Probably some better way to handle state will be required later
    getSelectedAccountFilename(): string {
        let state: StateObject;
        try {
            state = <StateObject> require(this.getStateFilePath());
        } catch(e) {
            throw this.createDataReadError();
        }

        return state.selectedAccountFilename;
    }

    getSelectedAccount(): NamedKeyringPair | null {
        const selectedAccountFilename = this.getSelectedAccountFilename();

        if (!selectedAccountFilename) {
            return null;
        }

        const account = this.fetchAccountOrNullFromFile(
            path.join(this.getAccountsDirPath(), selectedAccountFilename)
        );

        return account;
    }

    // Use when account usage is required in given command
    async getRequiredSelectedAccount(promptIfMissing: boolean = true): Promise<NamedKeyringPair> {
        let selectedAccount: NamedKeyringPair | null = this.getSelectedAccount();
        if (!selectedAccount) {
            this.warn('No default account selected! Use account:choose to set the default account!');
            if (!promptIfMissing) this.exit(ExitCodes.NoAccountSelected);
            const accounts: NamedKeyringPair[] = this.fetchAccounts();
            if (!accounts.length) {
                this.error('There are no accounts available!', { exit: ExitCodes.NoAccountFound });
            }

            selectedAccount = await this.promptForAccount(accounts);
        }

        return selectedAccount;
    }

    setSelectedAccount(account: NamedKeyringPair): void {
        let state: StateObject;
        try {
            state = <StateObject> require(this.getStateFilePath());
        } catch(e) {
            throw this.createDataReadError();
        }

        state.selectedAccountFilename = this.generateAccountFilename(account);

        try {
            fs.writeFileSync(this.getStateFilePath(), JSON.stringify(state));
        } catch(e) {
            throw this.createDataWriteError();
        }
    }

    async promptForPassword(message:string = 'Your account\'s password') {
        const { password } = await inquirer.prompt([
            { name: 'password', type: 'password', message }
        ]);

        return password;
    }

    async requireConfirmation(message: string = 'Are you sure you want to execute this action?'): Promise<void> {
        const { confirmed } = await inquirer.prompt([
            { type: 'confirm', name: 'confirmed', message, default: false }
        ]);
        if (!confirmed) this.exit(ExitCodes.OK);
    }

    async promptForAccount(
        accounts: NamedKeyringPair[],
        defaultAccount: NamedKeyringPair | null = null,
        message: string = 'Select an account',
        showBalances: boolean = true
    ): Promise<NamedKeyringPair> {
        let balances: AccountBalances[];
        if (showBalances) {
            balances = await this.getApi().getAccountsBalancesInfo(accounts.map(acc => acc.address));
        }
        const { chosenAccountFilename } = await inquirer.prompt([{
            name: 'chosenAccountFilename',
            message,
            type: 'list',
            choices: accounts.map((account: NamedKeyringPair, i) => ({
                name:
                    `${ account.meta.name }: `+
                    ( showBalances ? `${ formatBalance(balances[i].free) } / ${ formatBalance(balances[i].total) } ` : ' ')+
                    account.address,
                value: this.generateAccountFilename(account)
            })),
            default: defaultAccount && this.generateAccountFilename(defaultAccount)
        }]);

        return <NamedKeyringPair> accounts.find(acc => this.generateAccountFilename(acc) === chosenAccountFilename);
    }

    async requestAccountDecoding(account: NamedKeyringPair): Promise<void> {
        const password: string = await this.promptForPassword();
        try {
            account.decodePkcs8(password);
        } catch (e) {
            this.error('Invalid password!', { exit: ExitCodes.InvalidInput });
        }
    }

    async init() {
        this.api = await Api.create();
        try {
            this.initDataDir();
        } catch (e) {
            this.error(
                'Unexpected error while trying to initialize the data directory! Permissions issue?',
                { exit: ExitCodes.FsOperationFailed }
            );
        }
    }

    async finally(err: any) {
        // called after run and catch regardless of whether or not the command errored
        // We'll force exit here, in case there is no error, to prevent console.log from hanging the process
        if (!err) this.exit(ExitCodes.OK);
        super.finally(err);
    }
}
