import { PalletCommonWorkingGroup as WorkingGroup } from '@polkadot/types/lookup'
import { AugmentedConsts } from '@polkadot/api/types'
import BN from 'bn.js'
import { ProposalType, WorkingGroupModuleName } from './types'

export const debuggingCli = false // set to true to see CLI commands run

// Dummy const type validation function (see: https://stackoverflow.com/questions/57069802/as-const-is-ignored-when-there-is-a-type-definition)
export const validateType = <T>(obj: T) => obj

// Test chain blocktime
export const BLOCKTIME = 1000

// Known worker role account default balance (JOY)
export const KNOWN_WORKER_ROLE_ACCOUNT_DEFAULT_BALANCE = new BN(100000000000)

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
  if (group.isContent) {
    return 'contentWorkingGroup'
  } else if (group.isMembership) {
    return 'membershipWorkingGroup'
  } else if (group.isForum) {
    return 'forumWorkingGroup'
  } else if (group.isStorage) {
    return 'storageWorkingGroup'
  } else if (group.isOperationsAlpha) {
    return 'operationsWorkingGroupAlpha'
  } else if (group.isGateway) {
    return 'gatewayWorkingGroup'
  } else if (group.isDistribution) {
    return 'distributionWorkingGroup'
  } else if (group.isOperationsBeta) {
    return 'operationsWorkingGroupBeta'
  } else if (group.isOperationsGamma) {
    return 'operationsWorkingGroupGamma'
  }

  throw new Error(`Unsupported working group: ${group}`)
}

// Proposals

export const proposalTypeToProposalParamsKey = {
  'AmendConstitution': 'amendConstitutionProposalParameters',
  'CancelWorkingGroupLeadOpening': 'cancelWorkingGroupLeadOpeningProposalParameters',
  'CreateWorkingGroupLeadOpening': 'createWorkingGroupLeadOpeningProposalParameters',
  'DecreaseWorkingGroupLeadStake': 'decreaseWorkingGroupLeadStakeProposalParameters',
  'FillWorkingGroupLeadOpening': 'fillWorkingGroupOpeningProposalParameters',
  'FundingRequest': 'fundingRequestProposalParameters',
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
  'UpdateWorkingGroupBudget': 'updateWorkingGroupBudgetProposalParameters',
  'VetoProposal': 'vetoProposalProposalParameters',
  'UpdateGlobalNftLimit': 'updateGlobalNftLimitProposalParameters',
  'UpdateChannelPayouts': 'updateChannelPayoutsProposalParameters',
} as const

type ProposalTypeToProposalParamsKeyMap = { [K in ProposalType]: keyof AugmentedConsts<'promise'>['proposalsCodex'] }
validateType<ProposalTypeToProposalParamsKeyMap>(proposalTypeToProposalParamsKey)
