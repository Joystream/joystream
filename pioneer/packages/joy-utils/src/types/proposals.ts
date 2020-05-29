import { ProposalId, VoteKind } from '@joystream/types/proposals';
import { MemberId } from '@joystream/types/members';
import { ParsedMember } from './members';

export const ProposalTypes = [
  'Text',
  'RuntimeUpgrade',
  'SetElectionParameters',
  'Spending',
  'SetLead',
  'SetContentWorkingGroupMintCapacity',
  'EvictStorageProvider',
  'SetValidatorCount',
  'SetStorageRoleParameters'
] as const;

export type ProposalType = typeof ProposalTypes[number];

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

export type ProposalVote = {
  vote: VoteKind | null;
  member: ParsedMember & { memberId: MemberId };
};

export const Categories = {
  storage: 'Storage',
  council: 'Council',
  validators: 'Validators',
  cwg: 'Content Working Group',
  other: 'Other'
} as const;

export type Category = typeof Categories[keyof typeof Categories];

export type ProposalMeta = {
  description: string;
  category: Category;
  stake: number;
  approvalQuorum: number;
  approvalThreshold: number;
  slashingQuorum: number;
  slashingThreshold: number;
}
