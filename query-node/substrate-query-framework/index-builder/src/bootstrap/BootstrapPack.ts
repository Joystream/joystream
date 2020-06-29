import { ApiPromise } from '@polkadot/api';
import { DatabaseManager } from '..';

export type BootstrapResult = void | Promise<void>;

export type BootstrapFunc = (api: ApiPromise, db: DatabaseManager) => BootstrapResult;

export default interface BootstrapPack {
  pack: BootstrapFunc[];
}
