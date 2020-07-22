import fs from 'fs';
import path from 'path';
import ExitCodes from '../ExitCodes';
import { CLIError } from '@oclif/errors';
import { DEFAULT_API_URI } from '../Api';
import lockFile from 'proper-lockfile';
import DefaultCommandBase from './DefaultCommandBase';

// Type for the state object (which is preserved as json in the state file)
type StateObject = {
    selectedAccountFilename: string,
    apiUri: string
};

// State object default values
const DEFAULT_STATE: StateObject = {
    selectedAccountFilename: '',
    apiUri: DEFAULT_API_URI
}

// State file path (relative to this.config.dataDir)
const STATE_FILE = '/state.json';

// Possible data directory access errors
enum DataDirErrorType {
    Init = 0,
    Read = 1,
    Write = 2,
}

/**
 * Abstract base class for commands that need to work with the preserved state.
 *
 * The preserved state is kept in a json file inside the data directory (this.config.dataDir, supplied by oclif).
 * The state object contains all the information that needs to be preserved across sessions, ie. the default account
 * choosen by the user after executing account:choose command etc. (see "StateObject" type above).
 */
export default abstract class StateAwareCommandBase extends DefaultCommandBase {
    getStateFilePath(): string {
        return path.join(this.config.dataDir, STATE_FILE);
    }

    private createDataDirFsError(errorType: DataDirErrorType, specificPath: string = '') {
        const actionStrs: { [x in DataDirErrorType]: string } = {
            [DataDirErrorType.Init]: 'initialize',
            [DataDirErrorType.Read]: 'read from',
            [DataDirErrorType.Write]: 'write into'
        };

        const errorMsg =
            `Unexpected error while trying to ${ actionStrs[errorType] } the data directory.`+
            `(${ path.join(this.config.dataDir, specificPath) })! Permissions issue?`;

        return new CLIError(errorMsg, { exit: ExitCodes.FsOperationFailed });
    }

    createDataReadError(specificPath: string = ''): CLIError {
        return this.createDataDirFsError(DataDirErrorType.Read, specificPath);
    }

    createDataWriteError(specificPath: string = ''): CLIError {
        return this.createDataDirFsError(DataDirErrorType.Write, specificPath);
    }

    createDataDirInitError(specificPath: string = ''): CLIError {
        return this.createDataDirFsError(DataDirErrorType.Init, specificPath);
    }

    private initStateFs(): void {
        if (!fs.existsSync(this.config.dataDir)) {
            fs.mkdirSync(this.config.dataDir);
        }
        if (!fs.existsSync(this.getStateFilePath())) {
            fs.writeFileSync(this.getStateFilePath(), JSON.stringify(DEFAULT_STATE));
        }
    }

    getPreservedState(): StateObject {
        let preservedState: StateObject;
        try {
            preservedState = <StateObject> require(this.getStateFilePath());
        } catch(e) {
            throw this.createDataReadError();
        }
        // The state preserved in a file may be missing some required values ie.
        // if the user previously used the older version of the software.
        // That's why we combine it with default state before returing.
        return { ...DEFAULT_STATE, ...preservedState };
    }

    // Modifies preserved state. Uses file lock in order to avoid updating an older state.
    // (which could potentialy change between read and write operation)
    async setPreservedState(modifiedState: Partial<StateObject>): Promise<void> {
        const stateFilePath = this.getStateFilePath();
        const unlock = await lockFile.lock(stateFilePath);
        let oldState: StateObject = this.getPreservedState();
        let newState: StateObject = { ...oldState, ...modifiedState };
        try {
            fs.writeFileSync(stateFilePath, JSON.stringify(newState));
        } catch(e) {
            await unlock();
            throw this.createDataWriteError();
        }
        await unlock();
    }

    async init() {
        await super.init();
        try {
            await this.initStateFs();
        } catch (e) {
            throw this.createDataDirInitError();
        }
    }
}
