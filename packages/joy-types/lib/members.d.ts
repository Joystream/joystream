import { EnumType, Option, Struct } from '@polkadot/types/codec';
import { Bool, BlockNumber, Moment, AccountId, BalanceOf, u64, Text } from '@polkadot/types';
export declare class MemberId extends u64 {
}
export declare class PaidTermId extends u64 {
}
export declare class SubscriptionId extends u64 {
}
export declare class Paid extends PaidTermId {
}
export declare class Screening extends AccountId {
}
export declare class EntryMethod extends EnumType<Paid | Screening> {
    constructor(value?: any, index?: number);
}
export declare type Profile = {
    id: MemberId;
    handle: Text;
    avatar_uri: Text;
    about: Text;
    registered_at_block: BlockNumber;
    registered_at_time: Moment;
    entry: EntryMethod;
    suspended: Bool;
    subscription: Option<SubscriptionId>;
};
export declare class UserInfo extends Struct {
    constructor(value?: any);
}
export declare type CheckedUserInfo = {
    handle: Text;
    avatar_uri: Text;
    about: Text;
};
export declare class PaidMembershipTerms extends Struct {
    constructor(value?: any);
    readonly id: PaidTermId;
    readonly fee: BalanceOf;
    readonly text: Text;
}
export declare function registerMembershipTypes(): void;
