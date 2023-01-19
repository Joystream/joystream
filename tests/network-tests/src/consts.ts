import {
  PalletCommonWorkingGroupIterableEnumsWorkingGroup,
  PalletCommonWorkingGroupIterableEnumsWorkingGroup as WorkingGroup,
} from '@polkadot/types/lookup'
import { AugmentedConsts } from '@polkadot/api/types'
import BN from 'bn.js'
import { ProposalType, WorkingGroupModuleName } from './types'
import { createType } from '@joystream/types'

export const debuggingCli = false // set to true to see CLI commands run

// Dummy const type validation function (see: https://stackoverflow.com/questions/57069802/as-const-is-ignored-when-there-is-a-type-definition)
export const validateType = <T>(obj: T) => obj

// Test chain blocktime
export const BLOCKTIME = 1000

// Known worker role account default balance (JOY)
export const KNOWN_WORKER_ROLE_ACCOUNT_DEFAULT_BALANCE = new BN(1000000000000)

export const ALL_BYTES = '0x' + Array.from({ length: 256 }, (v, i) => Buffer.from([i]).toString('hex')).join('')

export const workingGroups: WorkingGroupModuleName[] = [
  'storageWorkingGroup',
  'contentWorkingGroup',
  'forumWorkingGroup',
  'membershipWorkingGroup',
  'operationsWorkingGroupAlpha',
  'appWorkingGroup',
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
  'appWorkingGroup': 'App',
  'distributionWorkingGroup': 'Distribution',
  'operationsWorkingGroupBeta': 'OperationsBeta',
  'operationsWorkingGroupGamma': 'OperationsGamma',
}
validateType<{ [k in WorkingGroupModuleName]: string }>(workingGroupNameByModuleName)

export function getWorkingGroupNameByModuleName(
  group: WorkingGroupModuleName
): PalletCommonWorkingGroupIterableEnumsWorkingGroup {
  switch (group) {
    case 'storageWorkingGroup':
      return createType('PalletCommonWorkingGroupIterableEnumsWorkingGroup', 'Storage')
    case 'contentWorkingGroup':
      return createType('PalletCommonWorkingGroupIterableEnumsWorkingGroup', 'Content')
    case 'forumWorkingGroup':
      return createType('PalletCommonWorkingGroupIterableEnumsWorkingGroup', 'Forum')
    case 'membershipWorkingGroup':
      return createType('PalletCommonWorkingGroupIterableEnumsWorkingGroup', 'Membership')
    case 'operationsWorkingGroupAlpha':
      return createType('PalletCommonWorkingGroupIterableEnumsWorkingGroup', 'OperationsAlpha')
    case 'appWorkingGroup':
      return createType('PalletCommonWorkingGroupIterableEnumsWorkingGroup', 'App')
    case 'operationsWorkingGroupBeta':
      return createType('PalletCommonWorkingGroupIterableEnumsWorkingGroup', 'OperationsBeta')
    case 'distributionWorkingGroup':
      return createType('PalletCommonWorkingGroupIterableEnumsWorkingGroup', 'Distribution')
    default:
      return createType('PalletCommonWorkingGroupIterableEnumsWorkingGroup', 'OperationsGamma')
  }
}

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
  } else if (group.isApp) {
    return 'appWorkingGroup'
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
