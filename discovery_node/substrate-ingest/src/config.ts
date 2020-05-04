import { config } from 'dotenv';
import { getLogger } from 'log4js'

config();
const logger = getLogger();
logger.level = process.env.LOG_LEVEL || 'debug';

const DEFAULT_PROVIDER_URL = 'ws://localhost:9944' ;

export default class Config {
    // todo: take config path
    readonly _provider_url: string;

    constructor() {
        // for now, read off .env file and set process.env
        if (process.env.PROVIDER_URL == undefined) {
            logger.warn("No provider url is set, setting to localhost");
        }
        this._provider_url = process.env.PROVIDER_URL  || DEFAULT_PROVIDER_URL;
    } 

    get provider_url(): string {
        return this._provider_url;
    }
}
