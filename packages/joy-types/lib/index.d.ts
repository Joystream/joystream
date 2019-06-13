import { Enum, EnumType, Option } from '@polkadot/types/codec';
import { BlockNumber, AccountId, Balance, Hash, u32, Text } from '@polkadot/types';
declare const OptionText_base: import("@polkadot/types/types").Constructor<Option<import("@polkadot/types/types").Codec>>;
export declare class OptionText extends OptionText_base {
    static none(): OptionText;
    static some(text: string): OptionText;
}
export declare type TransferableStake = {
    seat: Balance;
    backing: Balance;
};
export declare type Stake = {
    new: Balance;
    transferred: Balance;
};
export declare type Backer = {
    member: AccountId;
    stake: Balance;
};
export declare type Seat = {
    member: AccountId;
    stake: Balance;
    backers: Backer[];
};
export declare type SealedVote = {
    voter: AccountId;
    commitment: Hash;
    stake: Stake;
    vote: Option<AccountId>;
};
export declare type Proposal = {
    id: u32;
    proposer: AccountId;
    stake: Balance;
    name: Text;
    description: Text;
    wasm_hash: Hash;
    proposed_at: BlockNumber;
    status: ProposalStatus;
};
export declare type ProposalVote = {
    voter: AccountId;
    kind: VoteKind;
};
export declare type TallyResult = {
    proposal_id: u32;
    abstentions: u32;
    approvals: u32;
    rejections: u32;
    slashes: u32;
    status: ProposalStatus;
    finalized_at: BlockNumber;
};
export declare class Announcing extends BlockNumber {
}
export declare class Voting extends BlockNumber {
}
export declare class Revealing extends BlockNumber {
}
export declare class ElectionStage extends EnumType<Announcing | Voting | Revealing> {
    constructor(value?: any, index?: number);
    /** Create a new Announcing stage. */
    static Announcing(endsAt: BlockNumber | number): ElectionStage;
    /** Create a new Voting stage. */
    static Voting(endsAt: BlockNumber | number): ElectionStage;
    /** Create a new Revealing stage. */
    static Revealing(endsAt: BlockNumber | number): ElectionStage;
    static newElectionStage(stageName: string, endsAt: BlockNumber | number): ElectionStage;
}
export declare type AnyElectionStage = Announcing | Voting | Revealing;
export declare const ProposalStatuses: {
    [key: string]: string;
};
export declare class ProposalStatus extends Enum {
    constructor(value?: any);
}
export declare const VoteKinds: {
    [key: string]: string;
};
export declare class VoteKind extends Enum {
    constructor(value?: any);
}
export declare type ProposalVotes = [AccountId, VoteKind][];
export declare function registerJoystreamTypes(): void;
export {};
