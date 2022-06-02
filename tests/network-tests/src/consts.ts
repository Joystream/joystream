import { WorkingGroup } from '@joystream/types/common'
import { AugmentedConsts } from '@polkadot/api/types'
import BN from 'bn.js'
import { ProposalType, WorkingGroupModuleName } from './types'

export const debuggingCli = false // set to true to see CLI commands run

// Dummy const type validation function (see: https://stackoverflow.com/questions/57069802/as-const-is-ignored-when-there-is-a-type-definition)
export const validateType = <T>(obj: T) => obj

// Test chain blocktime
export const BLOCKTIME = 1000

// Known worker role account default balance (JOY)
export const KNOWN_WORKER_ROLE_ACCOUNT_DEFAULT_BALANCE = new BN(100000)

export const MINIMUM_STAKING_ACCOUNT_BALANCE = 200
export const MIN_APPLICATION_STAKE = new BN(2000)
export const MIN_UNSTANKING_PERIOD = 43201
export const LEADER_OPENING_STAKE = new BN(2000)
export const THREAD_DEPOSIT = new BN(30)
export const POST_DEPOSIT = new BN(10)
export const PROPOSALS_POST_DEPOSIT = new BN(2000)
export const ALL_BYTES = '0x' + Array.from({ length: 256 }, (v, i) => Buffer.from([i]).toString('hex')).join('')

export const workingGroups: WorkingGroupModuleName[] = [
  'storageWorkingGroup',
  'contentWorkingGroup',
  'forumWorkingGroup',
  'membershipWorkingGroup',
  'operationsWorkingGroupAlpha',
  'gatewayWorkingGroup',
  'distributionWorkingGroup',
  'operationsWorkingGroupBeta',
  'operationsWorkingGroupGamma',
]

export const workingGroupNameByModuleName = {
  'storageWorkingGroup': 'Storage',
  'contentWorkingGroup': 'Content',
  'forumWorkingGroup': 'Forum',
  'membershipWorkingGroup': 'Membership',
  'operationsWorkingGroupAlpha': 'OperationsAlpha',
  'gatewayWorkingGroup': 'Gateway',
  'distributionWorkingGroup': 'Distribution',
  'operationsWorkingGroupBeta': 'OperationsBeta',
  'operationsWorkingGroupGamma': 'OperationsGamma',
}
validateType<{ [k in WorkingGroupModuleName]: string }>(workingGroupNameByModuleName)

export function getWorkingGroupModuleName(group: WorkingGroup): WorkingGroupModuleName {
  if (group.isOfType('Content')) {
    return 'contentWorkingGroup'
  } else if (group.isOfType('Membership')) {
    return 'membershipWorkingGroup'
  } else if (group.isOfType('Forum')) {
    return 'forumWorkingGroup'
  } else if (group.isOfType('Storage')) {
    return 'storageWorkingGroup'
  } else if (group.isOfType('OperationsAlpha')) {
    return 'operationsWorkingGroupAlpha'
  } else if (group.isOfType('Gateway')) {
    return 'gatewayWorkingGroup'
  } else if (group.isOfType('Distribution')) {
    return 'distributionWorkingGroup'
  } else if (group.isOfType('OperationsBeta')) {
    return 'operationsWorkingGroupBeta'
  } else if (group.isOfType('OperationsGamma')) {
    return 'operationsWorkingGroupGamma'
  }

  throw new Error(`Unsupported working group: ${group}`)
}

// Proposals

export const proposalTypeToProposalParamsKey = {
  'AmendConstitution': 'amendConstitutionProposalParameters',
  'CancelWorkingGroupLeadOpening': 'cancelWorkingGroupLeadOpeningProposalParameters',
  'CreateBlogPost': 'createBlogPostProposalParameters',
  'CreateWorkingGroupLeadOpening': 'createWorkingGroupLeadOpeningProposalParameters',
  'DecreaseWorkingGroupLeadStake': 'decreaseWorkingGroupLeadStakeProposalParameters',
  'EditBlogPost': 'editBlogPostProoposalParamters',
  'FillWorkingGroupLeadOpening': 'fillWorkingGroupOpeningProposalParameters',
  'FundingRequest': 'fundingRequestProposalParameters',
  'LockBlogPost': 'lockBlogPostProposalParameters',
  'RuntimeUpgrade': 'runtimeUpgradeProposalParameters',
  'SetCouncilBudgetIncrement': 'setCouncilBudgetIncrementProposalParameters',
  'SetCouncilorReward': 'setCouncilorRewardProposalParameters',
  'SetInitialInvitationBalance': 'setInitialInvitationBalanceProposalParameters',
  'SetInitialInvitationCount': 'setInvitationCountProposalParameters',
  'SetMaxValidatorCount': 'setMaxValidatorCountProposalParameters',
  'SetMembershipLeadInvitationQuota': 'setMembershipLeadInvitationQuotaProposalParameters',
  'SetMembershipPrice': 'setMembershipPriceProposalParameters',
  'SetReferralCut': 'setReferralCutProposalParameters',
  'SetWorkingGroupLeadReward': 'setWorkingGroupLeadRewardProposalParameters',
  'Signal': 'signalProposalParameters',
  'SlashWorkingGroupLead': 'slashWorkingGroupLeadProposalParameters',
  'TerminateWorkingGroupLead': 'terminateWorkingGroupLeadProposalParameters',
  'UnlockBlogPost': 'unlockBlogPostProposalParameters',
  'UpdateWorkingGroupBudget': 'updateWorkingGroupBudgetProposalParameters',
  'VetoProposal': 'vetoProposalProposalParameters',
} as const

type ProposalTypeToProposalParamsKeyMap = { [K in ProposalType]: keyof AugmentedConsts<'promise'>['proposalsCodex'] }
validateType<ProposalTypeToProposalParamsKeyMap>(proposalTypeToProposalParamsKey)
