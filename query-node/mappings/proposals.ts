/*
eslint-disable @typescript-eslint/naming-convention
*/
import { SubstrateEvent, DatabaseManager } from '@dzlzv/hydra-common'
import { ProposalDetails as RuntimeProposalDetails, ProposalId } from '@joystream/types/augment/all'
import BN from 'bn.js'
import {
  Proposal,
  SignalProposalDetails,
  RuntimeUpgradeProposalDetails,
  FundingRequestProposalDetails,
  SetMaxValidatorCountProposalDetails,
  CreateWorkingGroupLeadOpeningProposalDetails,
  FillWorkingGroupLeadOpeningProposalDetails,
  UpdateWorkingGroupBudgetProposalDetails,
  DecreaseWorkingGroupLeadStakeProposalDetails,
  SlashWorkingGroupLeadProposalDetails,
  SetWorkingGroupLeadRewardProposalDetails,
  TerminateWorkingGroupLeadProposalDetails,
  AmendConstitutionProposalDetails,
  CancelWorkingGroupLeadOpeningProposalDetails,
  SetMembershipPriceProposalDetails,
  SetCouncilBudgetIncrementProposalDetails,
  SetCouncilorRewardProposalDetails,
  SetInitialInvitationBalanceProposalDetails,
  SetInitialInvitationCountProposalDetails,
  SetMembershipLeadInvitationQuotaProposalDetails,
  SetReferralCutProposalDetails,
  CreateBlogPostProposalDetails,
  EditBlogPostProposalDetails,
  LockBlogPostProposalDetails,
  UnlockBlogPostProposalDetails,
  VetoProposalDetails,
  ProposalDetails,
  FundingRequestDestinationsList,
  FundingRequestDestination,
  Membership,
  ProposalStatusDeciding,
  ProposalIntermediateStatus,
  ProposalStatusDormant,
  ProposalStatusGracing,
  ProposalStatusUpdatedEvent,
  ProposalDecisionStatus,
  ProposalStatusCancelled,
  ProposalStatusExpired,
  ProposalStatusRejected,
  ProposalStatusSlashed,
  ProposalStatusVetoed,
  ProposalDecisionMadeEvent,
  ProposalStatusCanceledByRuntime,
} from 'query-node/dist/model'
import { genericEventFields, getWorkingGroupModuleName, perpareString } from './common'
import { ProposalsEngine, ProposalsCodex } from './generated/types'
import { createWorkingGroupOpeningMetadata } from './workingGroups'

// FIXME: https://github.com/Joystream/joystream/issues/2457
type ProposalsMappingsMemoryCache = {
  lastCreatedProposalId: ProposalId | null
}
const proposalsMappingsMemoryCache: ProposalsMappingsMemoryCache = {
  lastCreatedProposalId: null,
}

async function getProposal(db: DatabaseManager, id: string) {
  const proposal = await db.get(Proposal, { where: { id } })
  if (!proposal) {
    throw new Error(`Proposal not found by id: ${id}`)
  }

  return proposal
}

async function parseProposalDetails(
  event_: SubstrateEvent,
  db: DatabaseManager,
  proposalDetails: RuntimeProposalDetails
): Promise<typeof ProposalDetails> {
  const eventTime = new Date(event_.blockTimestamp)

  // SignalProposalDetails:
  if (proposalDetails.isSignal) {
    const details = new SignalProposalDetails()
    const specificDetails = proposalDetails.asSignal
    details.text = perpareString(specificDetails.toString())
    return details
  }
  // RuntimeUpgradeProposalDetails:
  else if (proposalDetails.isRuntimeUpgrade) {
    const details = new RuntimeUpgradeProposalDetails()
    const specificDetails = proposalDetails.asRuntimeUpgrade
    details.wasmBytecode = Buffer.from(specificDetails.toU8a(true))
    return details
  }
  // FundingRequestProposalDetails:
  else if (proposalDetails.isFundingRequest) {
    const destinationsList = new FundingRequestDestinationsList()
    const specificDetails = proposalDetails.asFundingRequest
    await db.save<FundingRequestDestinationsList>(destinationsList)
    await Promise.all(
      specificDetails.map(({ account, amount }) =>
        db.save(
          new FundingRequestDestination({
            createdAt: eventTime,
            updatedAt: eventTime,
            account: account.toString(),
            amount: new BN(amount.toString()),
            list: destinationsList,
          })
        )
      )
    )
    const details = new FundingRequestProposalDetails()
    details.destinationsListId = destinationsList.id
    return details
  }
  // SetMaxValidatorCountProposalDetails:
  else if (proposalDetails.isSetMaxValidatorCount) {
    const details = new SetMaxValidatorCountProposalDetails()
    const specificDetails = proposalDetails.asSetMaxValidatorCount
    details.newMaxValidatorCount = specificDetails.toNumber()
    return details
  }
  // CreateWorkingGroupLeadOpeningProposalDetails:
  else if (proposalDetails.isCreateWorkingGroupLeadOpening) {
    const details = new CreateWorkingGroupLeadOpeningProposalDetails()
    const specificDetails = proposalDetails.asCreateWorkingGroupLeadOpening
    const metadata = await createWorkingGroupOpeningMetadata(db, eventTime, specificDetails.description)
    details.groupId = getWorkingGroupModuleName(specificDetails.working_group)
    details.metadataId = metadata.id
    details.rewardPerBlock = new BN(specificDetails.reward_per_block.unwrapOr(0).toString())
    details.stakeAmount = new BN(specificDetails.stake_policy.stake_amount.toString())
    details.unstakingPeriod = specificDetails.stake_policy.leaving_unstaking_period.toNumber()
    return details
  }
  // FillWorkingGroupLeadOpeningProposalDetails:
  else if (proposalDetails.isFillWorkingGroupLeadOpening) {
    const details = new FillWorkingGroupLeadOpeningProposalDetails()
    const specificDetails = proposalDetails.asFillWorkingGroupLeadOpening
    const groupModuleName = getWorkingGroupModuleName(specificDetails.working_group)
    details.openingId = `${groupModuleName}-${specificDetails.opening_id.toString()}`
    details.applicationId = `${groupModuleName}-${specificDetails.successful_application_id.toString()}`
    return details
  }
  // UpdateWorkingGroupBudgetProposalDetails:
  else if (proposalDetails.isUpdateWorkingGroupBudget) {
    const details = new UpdateWorkingGroupBudgetProposalDetails()
    const specificDetails = proposalDetails.asUpdateWorkingGroupBudget
    const [amount, workingGroup, balanceKind] = specificDetails
    details.groupId = getWorkingGroupModuleName(workingGroup)
    details.amount = amount.muln(balanceKind.isNegative ? -1 : 1)
    return details
  }
  // DecreaseWorkingGroupLeadStakeProposalDetails:
  else if (proposalDetails.isDecreaseWorkingGroupLeadStake) {
    const details = new DecreaseWorkingGroupLeadStakeProposalDetails()
    const specificDetails = proposalDetails.asDecreaseWorkingGroupLeadStake
    const [workerId, amount, workingGroup] = specificDetails
    details.amount = new BN(amount.toString())
    details.leadId = `${getWorkingGroupModuleName(workingGroup)}-${workerId.toString()}`
    return details
  }
  // SlashWorkingGroupLeadProposalDetails:
  else if (proposalDetails.isSlashWorkingGroupLead) {
    const details = new SlashWorkingGroupLeadProposalDetails()
    const specificDetails = proposalDetails.asSlashWorkingGroupLead
    const [workerId, amount, workingGroup] = specificDetails
    details.amount = new BN(amount.toString())
    details.leadId = `${getWorkingGroupModuleName(workingGroup)}-${workerId.toString()}`
    return details
  }
  // SetWorkingGroupLeadRewardProposalDetails:
  else if (proposalDetails.isSetWorkingGroupLeadReward) {
    const details = new SetWorkingGroupLeadRewardProposalDetails()
    const specificDetails = proposalDetails.asSetWorkingGroupLeadReward
    const [workerId, reward, workingGroup] = specificDetails
    details.newRewardPerBlock = new BN(reward.unwrapOr(0).toString())
    details.leadId = `${getWorkingGroupModuleName(workingGroup)}-${workerId.toString()}`
    return details
  }
  // TerminateWorkingGroupLeadProposalDetails:
  else if (proposalDetails.isTerminateWorkingGroupLead) {
    const details = new TerminateWorkingGroupLeadProposalDetails()
    const specificDetails = proposalDetails.asTerminateWorkingGroupLead
    details.leadId = `${getWorkingGroupModuleName(
      specificDetails.working_group
    )}-${specificDetails.worker_id.toString()}`
    details.slashingAmount = specificDetails.slashing_amount.isSome
      ? new BN(specificDetails.slashing_amount.unwrap().toString())
      : undefined
    return details
  }
  // AmendConstitutionProposalDetails:
  else if (proposalDetails.isAmendConstitution) {
    const details = new AmendConstitutionProposalDetails()
    const specificDetails = proposalDetails.asAmendConstitution
    details.text = perpareString(specificDetails.toString())
    return details
  }
  // CancelWorkingGroupLeadOpeningProposalDetails:
  else if (proposalDetails.isCancelWorkingGroupLeadOpening) {
    const details = new CancelWorkingGroupLeadOpeningProposalDetails()
    const [openingId, workingGroup] = proposalDetails.asCancelWorkingGroupLeadOpening
    details.openingId = `${getWorkingGroupModuleName(workingGroup)}-${openingId.toString()}`
    return details
  }
  // SetCouncilBudgetIncrementProposalDetails:
  else if (proposalDetails.isSetCouncilBudgetIncrement) {
    const details = new SetCouncilBudgetIncrementProposalDetails()
    const specificDetails = proposalDetails.asSetCouncilBudgetIncrement
    details.newAmount = new BN(specificDetails.toString())
    return details
  }
  // SetMembershipPriceProposalDetails:
  else if (proposalDetails.isSetMembershipPrice) {
    const details = new SetMembershipPriceProposalDetails()
    const specificDetails = proposalDetails.asSetMembershipPrice
    details.newPrice = new BN(specificDetails.toString())
    return details
  }
  // SetCouncilorRewardProposalDetails:
  else if (proposalDetails.isSetCouncilorReward) {
    const details = new SetCouncilorRewardProposalDetails()
    const specificDetails = proposalDetails.asSetCouncilorReward
    details.newRewardPerBlock = new BN(specificDetails.toString())
    return details
  }
  // SetInitialInvitationBalanceProposalDetails:
  else if (proposalDetails.isSetInitialInvitationBalance) {
    const details = new SetInitialInvitationBalanceProposalDetails()
    const specificDetails = proposalDetails.asSetInitialInvitationBalance
    details.newInitialInvitationBalance = new BN(specificDetails.toString())
    return details
  }
  // SetInitialInvitationCountProposalDetails:
  else if (proposalDetails.isSetInitialInvitationCount) {
    const details = new SetInitialInvitationCountProposalDetails()
    const specificDetails = proposalDetails.asSetInitialInvitationCount
    details.newInitialInvitationsCount = specificDetails.toNumber()
    return details
  }
  // SetMembershipLeadInvitationQuotaProposalDetails:
  else if (proposalDetails.isSetMembershipLeadInvitationQuota) {
    const details = new SetMembershipLeadInvitationQuotaProposalDetails()
    const specificDetails = proposalDetails.asSetMembershipLeadInvitationQuota
    details.newLeadInvitationQuota = specificDetails.toNumber()
    return details
  }
  // SetReferralCutProposalDetails:
  else if (proposalDetails.isSetReferralCut) {
    const details = new SetReferralCutProposalDetails()
    const specificDetails = proposalDetails.asSetReferralCut
    details.newReferralCut = specificDetails.toNumber()
    return details
  }
  // CreateBlogPostProposalDetails:
  else if (proposalDetails.isCreateBlogPost) {
    const details = new CreateBlogPostProposalDetails()
    const specificDetails = proposalDetails.asCreateBlogPost
    // TODO:
  }
  // EditBlogPostProposalDetails:
  else if (proposalDetails.isEditBlogPost) {
    const details = new EditBlogPostProposalDetails()
    const specificDetails = proposalDetails.asEditBlogPost
    // TODO:
  }
  // LockBlogPostProposalDetails:
  else if (proposalDetails.isLockBlogPost) {
    const details = new LockBlogPostProposalDetails()
    const specificDetails = proposalDetails.asLockBlogPost
    // TODO:
  }
  // UnlockBlogPostProposalDetails:
  else if (proposalDetails.isUnlockBlogPost) {
    const details = new UnlockBlogPostProposalDetails()
    const specificDetails = proposalDetails.asUnlockBlogPost
    // TODO:
  }
  // VetoProposalDetails:
  else if (proposalDetails.isVetoProposal) {
    const details = new VetoProposalDetails()
    const specificDetails = proposalDetails.asVetoProposal
    details.proposalId = specificDetails.toString()
    return details
  }

  throw new Error(`Unspported proposal details type: ${proposalDetails.type}`)
}

export async function proposalsEngine_ProposalCreated(db: DatabaseManager, event_: SubstrateEvent): Promise<void> {
  const [, proposalId] = new ProposalsEngine.ProposalCreatedEvent(event_).params

  // Cache the id
  proposalsMappingsMemoryCache.lastCreatedProposalId = proposalId
}

export async function proposalsCodex_ProposalCreated(db: DatabaseManager, event_: SubstrateEvent): Promise<void> {
  const [generalProposalParameters, runtimeProposalDetails] = new ProposalsCodex.ProposalCreatedEvent(event_).params
  const eventTime = new Date(event_.blockTimestamp)
  const proposalDetails = await parseProposalDetails(event_, db, runtimeProposalDetails)

  if (!proposalsMappingsMemoryCache.lastCreatedProposalId) {
    throw new Error('Unexpected state: proposalsMappingsMemoryCache.lastCreatedProposalId is empty')
  }

  const proposal = new Proposal({
    id: proposalsMappingsMemoryCache.lastCreatedProposalId.toString(),
    createdAt: eventTime,
    updatedAt: eventTime,
    details: proposalDetails,
    councilApprovals: 0,
    creator: new Membership({ id: generalProposalParameters.member_id.toString() }),
    title: perpareString(generalProposalParameters.title.toString()),
    description: perpareString(generalProposalParameters.description.toString()),
    exactExecutionBlock: generalProposalParameters.exact_execution_block.unwrapOr(undefined)?.toNumber(),
    stakingAccount: generalProposalParameters.staking_account_id.toString(),
    status: new ProposalStatusDeciding(),
    statusSetAtBlock: event_.blockNumber,
    statusSetAtTime: eventTime,
  })
  await db.save<Proposal>(proposal)
}

export async function proposalsEngine_ProposalStatusUpdated(
  db: DatabaseManager,
  event_: SubstrateEvent
): Promise<void> {
  const [proposalId, status] = new ProposalsEngine.ProposalStatusUpdatedEvent(event_).params
  const proposal = await getProposal(db, proposalId.toString())
  const eventTime = new Date(event_.blockTimestamp)

  let newStatus: typeof ProposalIntermediateStatus
  if (status.isActive) {
    newStatus = new ProposalStatusDeciding()
  } else if (status.isPendingConstitutionality) {
    newStatus = new ProposalStatusDormant()
  } else if (status.isPendingExecution) {
    newStatus = new ProposalStatusGracing()
  } else {
    throw new Error(`Unexpected proposal status: ${status.type}`)
  }

  const proposalStatusUpdatedEvent = new ProposalStatusUpdatedEvent({
    ...genericEventFields(event_),
    newStatus,
    proposal,
  })
  await db.save<ProposalStatusUpdatedEvent>(proposalStatusUpdatedEvent)

  newStatus.proposalStatusUpdatedEventId = proposalStatusUpdatedEvent.id
  proposal.updatedAt = eventTime
  proposal.status = newStatus

  await db.save<Proposal>(proposal)
}

export async function proposalsEngine_ProposalDecisionMade(db: DatabaseManager, event_: SubstrateEvent): Promise<void> {
  const [proposalId, decision] = new ProposalsEngine.ProposalDecisionMadeEvent(event_).params
  const proposal = await getProposal(db, proposalId.toString())
  const eventTime = new Date(event_.blockTimestamp)

  let decisionStatus: typeof ProposalDecisionStatus
  if (decision.isApproved) {
    if (decision.asApproved.isPendingConstitutionality) {
      decisionStatus = new ProposalStatusDormant()
    } else {
      decisionStatus = new ProposalStatusGracing()
    }
  } else if (decision.isCanceled) {
    decisionStatus = new ProposalStatusCancelled()
  } else if (decision.isCanceledByRuntime) {
    decisionStatus = new ProposalStatusCanceledByRuntime()
  } else if (decision.isExpired) {
    decisionStatus = new ProposalStatusExpired()
  } else if (decision.isRejected) {
    decisionStatus = new ProposalStatusRejected()
  } else if (decision.isSlashed) {
    decisionStatus = new ProposalStatusSlashed()
  } else if (decision.isVetoed) {
    decisionStatus = new ProposalStatusVetoed()
  } else {
    throw new Error(`Unexpected proposal decision: ${decision.type}`)
  }

  const proposalDecisionMadeEvent = new ProposalDecisionMadeEvent({
    ...genericEventFields(event_),
    decisionStatus,
    proposal,
  })
  await db.save<ProposalDecisionMadeEvent>(proposalDecisionMadeEvent)

  // We don't handle Cancelled, Dormant and Gracing statuses here, since they emit separate events
  if (
    [
      'ProposalStatusCanceledByRuntime',
      'ProposalStatusExpired',
      'ProposalStatusRejected',
      'ProposalStatusSlashed',
      'ProposalStatusVetoed',
    ].includes(decisionStatus.isTypeOf)
  ) {
    ;(decisionStatus as
      | ProposalStatusCanceledByRuntime
      | ProposalStatusExpired
      | ProposalStatusRejected
      | ProposalStatusSlashed
      | ProposalStatusVetoed).proposalDecisionMadeEventId = proposalDecisionMadeEvent.id
    proposal.status = decisionStatus
    proposal.updatedAt = eventTime
    await db.save<Proposal>(proposal)
  }
}

export async function proposalsEngine_ProposalExecuted(db: DatabaseManager, event_: SubstrateEvent): Promise<void> {
  // TODO
}

export async function proposalsEngine_Voted(db: DatabaseManager, event_: SubstrateEvent): Promise<void> {
  // TODO
}

export async function proposalsEngine_ProposalCancelled(db: DatabaseManager, event_: SubstrateEvent): Promise<void> {
  // TODO
}
