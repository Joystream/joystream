import { Profile } from "@joystream/types/members";
import { ProposalId } from "@joystream/types/proposals";
// FIXME: Those don't have the same names as in the runtime
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

export type ParsedProposal = {
  id: ProposalId;
  type: ProposalType;
  title: string;
  description: string;
  status: any;
  proposer: Profile;
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
};

export abstract class Transport {
  abstract proposals(): Promise<ParsedProposal[]>;
}
