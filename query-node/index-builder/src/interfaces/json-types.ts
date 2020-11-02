import * as BN from 'bn.js';

export declare type AnyJsonField = string | number | boolean | AnyJson | Array<AnyJsonField> | Array<AnyJson>

export declare type AnyJson = {
    [index: string]: AnyJsonField;
};

export declare type AnyNumber = BN | BigInt | Uint8Array | number | string;
