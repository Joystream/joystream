import * as BN from 'bn.js';

export declare type AnyJson = string | number | boolean | null | undefined | Array<AnyJson> | {
    [index: string]: AnyJson;
};

export declare type AnyNumber = BN | BigInt | Uint8Array | number | string;
