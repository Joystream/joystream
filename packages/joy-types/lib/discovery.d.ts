import { Struct } from '@polkadot/types/codec';
import { BlockNumber, Text } from '@polkadot/types';
export declare class IPNSIdentity extends Text {
}
export declare class Url extends Text {
}
export declare class AccountInfo extends Struct {
    constructor(value?: any);
    readonly identity: IPNSIdentity;
    readonly expires_at: BlockNumber;
}
export declare function registerDiscoveryTypes(): void;
