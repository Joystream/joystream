import { ApiPromise } from '@polkadot/api';
import { QueryRunner } from 'typeorm';

export type BootstrapResult = void | Promise<void>;

export type BootstrapFunc = (api: ApiPromise, queryRunner: QueryRunner) => BootstrapResult; 

export default interface BootstrapPack {
    pack: BootstrapFunc[];
}