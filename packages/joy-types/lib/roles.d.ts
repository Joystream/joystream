import { Enum, Struct } from '@polkadot/types/codec';
import { BlockNumber, AccountId, Balance, u32 } from '@polkadot/types';
import { MemberId } from './members';
export declare class Role extends Enum {
    constructor(value?: any);
}
export declare class Actor extends Struct {
    constructor(value?: any);
    readonly member_id: MemberId;
    readonly role: Role;
    readonly account: AccountId;
    readonly joined_at: BlockNumber;
}
export declare type Request = [AccountId, MemberId, Role, BlockNumber];
export declare type Requests = Array<Request>;
export declare class RoleParameters extends Struct {
    constructor(value?: any);
    readonly min_stake: Balance;
    readonly max_actors: u32;
    readonly min_actors: u32;
    readonly reward: Balance;
    readonly reward_period: BlockNumber;
    readonly unbonding_period: BlockNumber;
    readonly bonding_period: BlockNumber;
    readonly min_service_period: BlockNumber;
    readonly startup_grace_period: BlockNumber;
    readonly entry_request_fee: Balance;
}
export declare function registerRolesTypes(): void;
