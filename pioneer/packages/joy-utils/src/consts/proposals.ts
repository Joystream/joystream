import { ProposalType, ProposalMeta } from '../types/proposals';

export const metadata: { [k in ProposalType]: ProposalMeta } = {
  EvictStorageProvider: {
    description: 'Evicting Storage Provider Proposal',
    category: 'Storage',
    stake: 25000,
    approvalQuorum: 50,
    approvalThreshold: 75,
    slashingQuorum: 60,
    slashingThreshold: 80
  },
  Text: {
    description: 'Signal Proposal',
    category: 'Other',
    stake: 25000,
    approvalQuorum: 60,
    approvalThreshold: 80,
    slashingQuorum: 60,
    slashingThreshold: 80
  },
  SetStorageRoleParameters: {
    description: 'Set Storage Role Params Proposal',
    category: 'Storage',
    stake: 100000,
    approvalQuorum: 66,
    approvalThreshold: 80,
    slashingQuorum: 60,
    slashingThreshold: 80
  },
  SetValidatorCount: {
    description: 'Set Max Validator Count Proposal',
    category: 'Validators',
    stake: 100000,
    approvalQuorum: 66,
    approvalThreshold: 80,
    slashingQuorum: 60,
    slashingThreshold: 80
  },
  SetLead: {
    description: 'Set Lead Proposal',
    category: 'Content Working Group',
    stake: 50000,
    approvalQuorum: 60,
    approvalThreshold: 75,
    slashingQuorum: 60,
    slashingThreshold: 80
  },
  SetContentWorkingGroupMintCapacity: {
    description: 'Set WG Mint Capacity Proposal',
    category: 'Content Working Group',
    stake: 50000,
    approvalQuorum: 60,
    approvalThreshold: 75,
    slashingQuorum: 60,
    slashingThreshold: 80
  },
  Spending: {
    description: 'Spending Proposal',
    category: 'Other',
    stake: 25000,
    approvalQuorum: 60,
    approvalThreshold: 80,
    slashingQuorum: 60,
    slashingThreshold: 80
  },
  SetElectionParameters: {
    description: 'Set Election Parameters Proposal',
    category: 'Council',
    stake: 200000,
    approvalQuorum: 66,
    approvalThreshold: 80,
    slashingQuorum: 60,
    slashingThreshold: 80
  },
  RuntimeUpgrade: {
    description: 'Runtime Upgrade Proposal',
    category: 'Other',
    stake: 1000000,
    approvalQuorum: 80,
    approvalThreshold: 100,
    slashingQuorum: 60,
    slashingThreshold: 80
  },
  AddWorkingGroupLeaderOpening: {
    description: 'Add Working Group Leader Opening Proposal',
    category: 'Other',
    stake: 100000,
    approvalQuorum: 60,
    approvalThreshold: 80,
    slashingQuorum: 60,
    slashingThreshold: 80
  }
};

type ProposalsApiMethodNames = {
  votingPeriod: string;
  gracePeriod: string;
}
export const apiMethods: { [k in ProposalType]: ProposalsApiMethodNames } = {
  EvictStorageProvider: {
    votingPeriod: 'evictStorageProviderProposalVotingPeriod',
    gracePeriod: 'evictStorageProviderProposalPeriod'
  },
  Text: {
    votingPeriod: 'textProposalVotingPeriod',
    gracePeriod: 'textProposalGracePeriod'
  },
  SetStorageRoleParameters: {
    votingPeriod: 'setStorageRoleParametersProposalVotingPeriod',
    gracePeriod: 'setStorageRoleParametersProposalGracePeriod'
  },
  SetValidatorCount: {
    votingPeriod: 'setValidatorCountProposalVotingPeriod',
    gracePeriod: 'setValidatorCountProposalGracePeriod'
  },
  SetLead: {
    votingPeriod: 'setLeadProposalVotingPeriod',
    gracePeriod: 'setLeadProposalGracePeriod'
  },
  SetContentWorkingGroupMintCapacity: {
    votingPeriod: 'setContentWorkingGroupMintCapacityProposalVotingPeriod',
    gracePeriod: 'setContentWorkingGroupMintCapacityProposalGracePeriod'
  },
  Spending: {
    votingPeriod: 'spendingProposalVotingPeriod',
    gracePeriod: 'spendingProposalGracePeriod'
  },
  SetElectionParameters: {
    votingPeriod: 'setElectionParametersProposalVotingPeriod',
    gracePeriod: 'setElectionParametersProposalGracePeriod'
  },
  RuntimeUpgrade: {
    votingPeriod: 'runtimeUpgradeProposalVotingPeriod',
    gracePeriod: 'runtimeUpgradeProposalGracePeriod'
  },
  AddWorkingGroupLeaderOpening: {
    votingPeriod: 'addWorkingGroupOpeningProposalVotingPeriod',
    gracePeriod: 'addWorkingGroupOpeningProposalGracePeriod'
  }
} as const;

export default metadata;
