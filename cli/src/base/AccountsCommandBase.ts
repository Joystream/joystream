import fs from 'fs';
import path from 'path';
import slug from 'slug';
import ExitCodes from '../ExitCodes';
import { CLIError } from '@oclif/errors';
import { Command } from '@oclif/command';
import { Keyring } from '@polkadot/api';
import { KeyringPair$Json } from '@polkadot/keyring/types';

type StateObject = {
    selectedAccountFilename: string
};

export default abstract class AccountsCommandBase extends Command {
    static ACCOUNTS_DIRNAME = '/accounts';
    static STATE_FILE = '/state.json';

    getAccountsDirPath(): string {
        return path.join(this.config.dataDir, AccountsCommandBase.ACCOUNTS_DIRNAME);
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

    generateAccountFilename(accountJsonObj: KeyringPair$Json): string {
        return `${ slug(accountJsonObj.meta.name, '_') }__${ accountJsonObj.address }.json`;
    }

    fetchJsonBackupAccountObj(jsonBackupFilePath: string): KeyringPair$Json {
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
        let keyring = new Keyring();
        try {
            // Try adding and retrieving the keys in order to validate that the backup file is correct
            keyring.addFromJson(accountJsonObj);
            keyring.getPair(accountJsonObj.address);
        } catch (e) {
            // TODO: Maybe check the exception to display more meaningful message?
            throw new CLIError('Provided backup file is not valid', { exit: ExitCodes.InvalidFile });
        }

        accountJsonObj = <KeyringPair$Json> accountJsonObj; // At this point we can assume that

        // Force some default account name if none provided
        if (!accountJsonObj.meta) accountJsonObj.meta = {};
        if (!accountJsonObj.meta.name) accountJsonObj.meta.name = 'Unnamed Account';

        return accountJsonObj;
    }

    private fetchAccountObjOrNullFromFile(jsonFilePath: string): KeyringPair$Json | null {
        try {
            return this.fetchJsonBackupAccountObj(jsonFilePath);
        } catch (e) {
            // Here in case of a typical CLIError we just return null (otherwise we throw)
            if (!(e instanceof CLIError)) throw e;
            return null;
        }
    }

    fetchAccounts(): KeyringPair$Json[] {
        let files: string[] = [];
        const accountDir = this.getAccountsDirPath();
        try {
            files = fs.readdirSync(accountDir);
        }
        catch(e) {
        }

        // We have to assert the type, because TS is not aware that we're filtering out the nulls at the end
        return <KeyringPair$Json[]> files
            .map(fileName => {
                const filePath = path.join(accountDir, fileName);
                return this.fetchAccountObjOrNullFromFile(filePath);
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

    setSelectedAccount(accountFilename: string): void {
        let state: StateObject;
        try {
            state = <StateObject> require(this.getStateFilePath());
        } catch(e) {
            throw this.createDataReadError();
        }

        state.selectedAccountFilename = accountFilename;

        try {
            fs.writeFileSync(this.getStateFilePath(), JSON.stringify(state));
        } catch(e) {
            throw this.createDataWriteError();
        }
    }

    async init() {
        try {
            this.initDataDir();
        } catch (e) {
            this.error(
                'Unexpected error while trying to initialize the data directory! Permissions issue?',
                { exit: ExitCodes.FsOperationFailed }
            );
        }
    }
}
