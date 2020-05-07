import Config from '../Config'
import ESUploader from '../esearch/ESUploader';

export interface State {
    lastProcessedBlock: number;  
    eventIndex: number;  
}

export class StateKeeper {
    private _config: Config;
    private _state: State;

    constructor (config: Config) {
        this._config = config;
        this._state = StateKeeper.nullState();
    }

    async state(): Promise<State> {
        // first, try to recover
        //this._state = await this._esUploader.restore();
        return this._state;
    }



    public static nullState(): State {
        return {
            lastProcessedBlock: -1,
            eventIndex: 0
        }
    }
}

module.exports = {
    StateKeeper
}