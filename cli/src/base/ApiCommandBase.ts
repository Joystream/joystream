import ExitCodes from '../ExitCodes';
import { CLIError } from '@oclif/errors';
import StateAwareCommandBase from './StateAwareCommandBase';
import Api from '../Api';
import { ApiPromise } from '@polkadot/api'

/**
 * Abstract base class for commands that require access to the API.
 */
export default abstract class ApiCommandBase extends StateAwareCommandBase {
    private api: Api | null = null;

    getApi(): Api {
        if (!this.api) throw new CLIError('Tried to get API before initialization.', { exit: ExitCodes.ApiError });
        return this.api;
    }

    // Get original api for lower-level api calls
    getOriginalApi(): ApiPromise {
        return this.getApi().getOriginalApi();
    }

    async init() {
        await super.init();
        const apiUri: string = this.getPreservedState().apiUri;
        this.api = await Api.create(apiUri);
    }
}
