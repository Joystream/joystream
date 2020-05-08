import Config from '../Config'

const logger = require('log4js').getLogger('state-keeper');

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

    set state(s: State) {
        logger.info(`State updated: ${JSON.stringify(s, null, 2)}`);
        this._state = s;
    }

    public static nullState(): State {
        return {
            lastProcessedBlock: -1,
            eventIndex: 0
        }
    }

    public shouldBootstrap(): boolean {
        return (this._state.lastProcessedBlock < 0)
    }
}

module.exports = {
    StateKeeper
}