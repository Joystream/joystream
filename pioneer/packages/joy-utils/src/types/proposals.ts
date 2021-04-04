import { ProposalId, VoteKind } from '@joystream/types/proposals';
import { MemberId, Membership } from '@joystream/types/members';
import { ThreadId, PostId } from '@joystream/types/common';
import { ParsedMember } from './members';
import { ProposalDetails, ProposalStatus, VotingResults, ProposalParameters } from '@joystream/types/src/proposals';

export const ProposalTypes = [
  'Text',
  'RuntimeUpgrade',
  'SetElectionParameters',
  'Spending',
  'SetLead',
  'SetContentWorkingGroupMintCapacity',
  'EvictStorageProvider',
  'SetValidatorCount',
  'SetStorageRoleParameters',
  'AddWorkingGroupLeaderOpening',
  'SetWorkingGroupMintCapacity',
  'BeginReviewWorkingGroupLeaderApplication',
  'FillWorkingGroupLeaderOpening',
  'SlashWorkingGroupLeaderStake',
  'DecreaseWorkingGroupLeaderStake',
  'SetWorkingGroupLeaderReward',
  'TerminateWorkingGroupLeaderRole'
] as const;

export type ProposalType = typeof ProposalTypes[number];

export const proposalStatusFilters = ['All', 'Active', 'Canceled', 'Approved', 'Rejected', 'Slashed', 'Expired'] as const;
export type ProposalStatusFilter = typeof proposalStatusFilters[number];

// Overriden for better optimalization
export type RuntimeUpgradeProposalDetails = [
  string, // hash as hex
  number // file size in bytes
]

export type ParsedProposalDetails = ProposalDetails | RuntimeUpgradeProposalDetails;

export type SpecificProposalDetails<T extends keyof ProposalDetails['typeDefinitions']> =
  T extends 'RuntimeUpgrade' ? RuntimeUpgradeProposalDetails :
    InstanceType<ProposalDetails['typeDefinitions'][Exclude<T, 'RuntimeUpgrade'>]>;

export type ParsedProposal = {
  id: ProposalId;
  type: ProposalType;
  title: string;
  description: string;
  status: ProposalStatus;
  proposer: ParsedMember;
  proposerId: number;
  createdAtBlock: number;
  createdAt: Date;
  details: ParsedProposalDetails;
  votingResults: VotingResults;
  parameters: ProposalParameters;
  cancellationFee: number;
};

export type ProposalsBatch = {
  batchNumber: number;
  batchSize: number;
  totalBatches: number;
  proposals: ParsedProposal[];
};

export type ProposalVote = {
  vote: VoteKind | null;
  member: ParsedMember & { memberId: MemberId };
};

export type ProposalVotes = {
  councilMembersLength: number;
  votes: ProposalVote[];
};

export const Categories = {
  council: 'Council',
  validators: 'Validators',
  wg: 'Working Groups',
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
  outdated?: boolean;
}

export type ParsedPost = {
  postId: PostId | null;
  threadId: ThreadId;
  text: string;
  createdAt: Date;
  createdAtBlock: number;
  updatedAt: Date;
  updatedAtBlock: number;
  author: Membership | null;
  authorId: MemberId;
  editsCount: number;
};

export type ParsedDiscussion = {
  title: string;
  threadId: ThreadId;
  posts: ParsedPost[];
};

export type DiscussionContraints = {
  maxPostLength: number;
  maxPostEdits: number;
}

export type HistoricalParsedPost = {
  postId: number;
  threadId: number;
  text: string;
  createdAt: string;
  createdAtBlock: number;
  updatedAt: string;
  updatedAtBlock: number;
  author: ParsedMember;
  authorId: number;
  editsCount: number;
}

export type HistoricalProposalData = {
  proposal: {
    id: number,
    parameters: unknown, // JSON of ProposalParameters
    proposerId: number,
    title: string,
    description: string,
    createdAt: string,
    status: unknown, // JSON of ProposalStatus
    votingResults: unknown, // JSON of VotingResults
    details: Record<string, unknown> | unknown[], // JSON of ParsedProposalDetails
    type: string,
    proposer: ParsedMember,
    createdAtBlock: number,
    cancellationFee: number
  },
  votes: {
    councilMembersLength: number,
    votes: {
      vote: string;
      member: ParsedMember & { memberId: number },
    }[]
  },
  discussion: {
    title: string,
    threadId: number,
    posts: HistoricalParsedPost[]
  }
}
