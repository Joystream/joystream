import { ProposalId, VoteKind } from "@joystream/types/proposals";
import { MemberId } from "@joystream/types/members";
export const ProposalTypes = [
  "Text",
  "RuntimeUpgrade",
  "SetElectionParameters",
  "Spending",
  "SetLead",
  "SetContentWorkingGroupMintCapacity",
  "EvictStorageProvider",
  "SetValidatorCount",
  "SetStorageRoleParameters"
] as const;

export type ProposalType = typeof ProposalTypes[number];

export type ParsedMember = {
  about: string;
  avatar_uri: string;
  handle: string;
  registered_at_block: number;
  registered_at_time: number;
  roles: any[];
  entry: { [k: string]: any };
  root_account: string;
  controller_account: string;
  subscription: any;
  suspended: boolean;
};

export type ParsedProposal = {
  id: ProposalId;
  type: ProposalType;
  title: string;
  description: string;
  status: any;
  proposer: ParsedMember;
  proposerId: number;
  createdAtBlock: number;
  createdAt: Date;
  details: any[];
  votingResults: any;
  parameters: {
    approvalQuorumPercentage: number;
    approvalThresholdPercentage: number;
    gracePeriod: number;
    requiredStake: number;
    slashingQuorumPercentage: number;
    slashingThresholdPercentage: number;
    votingPeriod: number;
  };
  cancellationFee: number;
};

export const StorageRoleParameters = [
  "min_stake",
  "min_actors",
  "max_actors",
  "reward",
  "reward_period",
  "bonding_period",
  "unbonding_period",
  "min_service_period",
  "startup_grace_period",
  "entry_request_fee"
] as const;

export type IStorageRoleParameters = {
  [k in typeof StorageRoleParameters[number]]: number;
};

export type ProposalVote = {
  vote: VoteKind | null;
  member: ParsedMember & { memberId: MemberId };
};

export abstract class Transport {
  abstract proposals(): Promise<ParsedProposal[]>;
}
