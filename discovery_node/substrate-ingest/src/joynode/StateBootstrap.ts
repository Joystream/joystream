import ISubstrateQueryService from './ISubstrateQueryService';
import { ApiPromise } from '@polkadot/api';

import { Profile } from '@joystream/types/lib/members';
import { Hash } from '@polkadot/types/interfaces';
import { Codec } from '@polkadot/types/types';
import { EventEmitter } from 'events';
import Config from '../Config';
const logger = require('log4js').getLogger('state-boot');

const DEFAULT_BOOTSTRAP_HEIGHT = 0;

export default class StateBootstrap extends EventEmitter {
    private _queryService: ISubstrateQueryService;
    private _api: ApiPromise;
    private _blockHeight: number
    
    constructor(queryService: ISubstrateQueryService, config: Config) {
        super();
        this._queryService = queryService;
        this._api = queryService.substrateAPI();
        this._blockHeight = config.get().bootstrap?.block || DEFAULT_BOOTSTRAP_HEIGHT;
        logger.debug(`Bootstrap at height ${this._blockHeight}`);
    }      

    public async fetch() {
        this.fetchMembers(this._blockHeight);
        // TODO: fetch other stuff like content etc
    }
    
    private async fetchMembers(height: number) {
        let genesis: Hash = await this._queryService.getBlockHash(height);
        let ids: Codec = await this._api.query.members.membersCreated.at(genesis);
        let num: number = parseInt(ids.toString())
        for (let i = 0; i < num; i++) {
            let profile = await this._api.query.members.memberProfile.at(genesis, i) as Profile;
            this.emit('BootstrapEntity', profile);
            logger.trace(`BootstrapEnitity: ${JSON.stringify(profile, null, 2)}`);
        }
    }
}