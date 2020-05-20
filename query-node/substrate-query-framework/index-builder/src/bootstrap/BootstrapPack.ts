import { ApiPromise } from '@polkadot/api';
import { DB } from '../db'

export type BootstrapResult = void | Promise<void>;

export type BootstrapFunc = (api: ApiPromise, db: DB) => BootstrapResult; 

export default interface BootstrapPack {
    pack: BootstrapFunc[];
}