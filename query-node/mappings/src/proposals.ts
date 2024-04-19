/*
eslint-disable @typescript-eslint/naming-convention
*/
import { DatabaseManager, EventContext, StoreContext, SubstrateEvent } from '@joystream/hydra-common'
import { Bytes } from '@polkadot/types'
import { blake2AsHex } from '@polkadot/util-crypto'
import BN from 'bn.js'
import {
  AmendConstitutionProposalDetails,
  CancelWorkingGroupLeadOpeningProposalDetails,
  CreateWorkingGroupLeadOpeningProposalDetails,
  DecreaseWorkingGroupLeadStakeProposalDetails,
  FillWorkingGroupLeadOpeningProposalDetails,
  FundingRequestDestination,
  FundingRequestDestinationsList,
  FundingRequestProposalDetails,
  Membership,
  Proposal,
  ProposalCancelledEvent,
  ProposalCreatedEvent,
  ProposalDecisionMadeEvent,
  ProposalDecisionStatus,
  ProposalDetails,
  ProposalDiscussionThread,
  ProposalDiscussionThreadModeOpen,
  ProposalExecutedEvent,
  ProposalExecutionStatus,
  ProposalIntermediateStatus,
  ProposalStatus,
  ProposalStatusCanceledByRuntime,
  ProposalStatusCancelled,
  ProposalStatusDeciding,
  ProposalStatusDormant,
  ProposalStatusExecuted,
  ProposalStatusExecutionFailed,
  ProposalStatusExpired,
  ProposalStatusGracing,
  ProposalStatusRejected,
  ProposalStatusSlashed,
  ProposalStatusUpdatedEvent,
  ProposalStatusVetoed,
  ProposalVoteKind,
  ProposalVotedEvent,
  RuntimeUpgradeProposalDetails,
  RuntimeWasmBytecode,
  SetCouncilBudgetIncrementProposalDetails,
  SetCouncilorRewardProposalDetails,
  SetInitialInvitationBalanceProposalDetails,
  SetInitialInvitationCountProposalDetails,
  SetMaxValidatorCountProposalDetails,
  SetMembershipLeadInvitationQuotaProposalDetails,
  SetMembershipPriceProposalDetails,
  SetReferralCutProposalDetails,
  SetWorkingGroupLeadRewardProposalDetails,
  SignalProposalDetails,
  SlashWorkingGroupLeadProposalDetails,
  TerminateWorkingGroupLeadProposalDetails,
  UpdateChannelPayoutsProposalDetails,
  UpdatePalletFrozenStatusProposalDetails,
  UpdateGlobalNftLimitProposalDetails,
  UpdateWorkingGroupBudgetProposalDetails,
  VetoProposalDetails,
  DecreaseCouncilBudgetProposalDetails,
  UpdateTokenPalletTokenConstraintsProposalDetails,
  SetEraPayoutDampingFactorProposalDetails,
} from 'query-node/dist/model'
import {
  INT32MAX,
  asBN,
  bytesToString,
  genericEventFields,
  getByIdOrFail,
  getWorkingGroupModuleName,
  toNumber,
  unimplementedError,
  unwrap,
  whenDef,
} from './common'
import {
  ProposalsCodex_ProposalCreatedEvent_V1001 as ProposalCreatedEvent_V1001,
  ProposalsCodex_ProposalCreatedEvent_V2003 as ProposalCreatedEvent_V2003,
  ProposalsEngine_ProposalCancelledEvent_V1001 as ProposalCancelledEvent_V1001,
  ProposalsEngine_ProposalDecisionMadeEvent_V1001 as ProposalDecisionMadeEvent_V1001,
  ProposalsEngine_ProposalExecutedEvent_V1001 as ProposalExecutedEvent_V1001,
  ProposalsEngine_ProposalStatusUpdatedEvent_V1001 as ProposalStatusUpdatedEvent_V1001,
  ProposalsEngine_VotedEvent_V1001 as ProposalVotedEvent_V1001,
} from '../generated/types'
import { PalletProposalsCodexProposalDetails as RuntimeProposalDetails_V2003 } from '../generated/types/2003/types-lookup'

import { createWorkingGroupOpeningMetadata } from './workingGroups'

async function getProposal(store: DatabaseManager, id: string) {
  return getByIdOrFail(store, Proposal, id)
}

async function getOrCreateRuntimeWasmBytecode(store: DatabaseManager, bytecode: Bytes) {
  const bytecodeHash = blake2AsHex(bytecode.toU8a(true))
  let wasmBytecode = await store.get(RuntimeWasmBytecode, { where: { id: bytecodeHash } })
  if (!wasmBytecode) {
    wasmBytecode = new RuntimeWasmBytecode({
      id: bytecodeHash,
      bytecode: Buffer.from(bytecode.toU8a(true)),
    })
    await store.save<RuntimeWasmBytecode>(wasmBytecode)
  }
  return wasmBytecode
}

async function parseProposalDetails(
  event: SubstrateEvent,
  store: DatabaseManager,
  proposalDetails: RuntimeProposalDetails_V2003
): Promise<typeof ProposalDetails> {
  const eventTime = new Date(event.blockTimestamp)

  // SignalProposalDetails:
  if (proposalDetails.isSignal) {
    const details = new SignalProposalDetails()
    const specificDetails = proposalDetails.asSignal
    details.text = bytesToString(specificDetails)
    return details
  }
  // RuntimeUpgradeProposalDetails:
  else if (proposalDetails.isRuntimeUpgrade) {
    const details = new RuntimeUpgradeProposalDetails()
    const runtimeBytecode = proposalDetails.asRuntimeUpgrade
    details.newRuntimeBytecodeId = (await getOrCreateRuntimeWasmBytecode(store, runtimeBytecode)).id
    return details
  }
  // FundingRequestProposalDetails:
  else if (proposalDetails.isFundingRequest) {
    const destinationsList = new FundingRequestDestinationsList()
    const specificDetails = proposalDetails.asFundingRequest
    await store.save<FundingRequestDestinationsList>(destinationsList)
    await Promise.all(
      specificDetails.map(({ account, amount }) =>
        store.save(
          new FundingRequestDestination({
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
    details.newMaxValidatorCount = toNumber(specificDetails, INT32MAX)
    return details
  }
  // CreateWorkingGroupLeadOpeningProposalDetails:
  else if (proposalDetails.isCreateWorkingGroupLeadOpening) {
    const details = new CreateWorkingGroupLeadOpeningProposalDetails()
    const specificDetails = proposalDetails.asCreateWorkingGroupLeadOpening
    const metadata = await createWorkingGroupOpeningMetadata(store, eventTime, specificDetails.description)
    details.groupId = getWorkingGroupModuleName(specificDetails.group)
    details.metadataId = metadata.id
    details.rewardPerBlock = new BN(specificDetails.rewardPerBlock.unwrapOr(0).toString())
    details.stakeAmount = new BN(specificDetails.stakePolicy.stakeAmount.toString())
    details.unstakingPeriod = toNumber(specificDetails.stakePolicy.leavingUnstakingPeriod, INT32MAX)
    return details
  }
  // FillWorkingGroupLeadOpeningProposalDetails:
  else if (proposalDetails.isFillWorkingGroupLeadOpening) {
    const details = new FillWorkingGroupLeadOpeningProposalDetails()
    const specificDetails = proposalDetails.asFillWorkingGroupLeadOpening
    const groupModuleName = getWorkingGroupModuleName(specificDetails.workingGroup)
    details.openingId = `${groupModuleName}-${specificDetails.openingId.toString()}`
    details.applicationId = `${groupModuleName}-${specificDetails.applicationId.toString()}`
    return details
  }
  // UpdateWorkingGroupBudgetProposalDetails:
  else if (proposalDetails.isUpdateWorkingGroupBudget) {
    const details = new UpdateWorkingGroupBudgetProposalDetails()
    const specificDetails = proposalDetails.asUpdateWorkingGroupBudget
    const [amount, workingGroup, balanceKind] = specificDetails
    details.groupId = getWorkingGroupModuleName(workingGroup)
    details.amount = new BN(`${balanceKind.isNegative ? '-' : ''}${amount.toString()}`)
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
    details.leadId = `${getWorkingGroupModuleName(specificDetails.group)}-${specificDetails.workerId.toString()}`
    details.slashingAmount = specificDetails.slashingAmount.isSome
      ? new BN(specificDetails.slashingAmount.unwrap().toString())
      : undefined
    return details
  }
  // AmendConstitutionProposalDetails:
  else if (proposalDetails.isAmendConstitution) {
    const details = new AmendConstitutionProposalDetails()
    const specificDetails = proposalDetails.asAmendConstitution
    details.text = bytesToString(specificDetails)
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
    console.log('SetCouncilBudgetIncrement specificDetails.toString():', new BN(specificDetails.toString()).toString())
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
    details.newInitialInvitationsCount = toNumber(specificDetails, INT32MAX)
    return details
  }
  // SetMembershipLeadInvitationQuotaProposalDetails:
  else if (proposalDetails.isSetMembershipLeadInvitationQuota) {
    const details = new SetMembershipLeadInvitationQuotaProposalDetails()
    const specificDetails = proposalDetails.asSetMembershipLeadInvitationQuota
    details.newLeadInvitationQuota = toNumber(specificDetails, INT32MAX)
    return details
  }
  // SetReferralCutProposalDetails:
  else if (proposalDetails.isSetReferralCut) {
    const details = new SetReferralCutProposalDetails()
    const specificDetails = proposalDetails.asSetReferralCut
    details.newReferralCut = specificDetails.toNumber()
    return details
  }
  // VetoProposalDetails:
  else if (proposalDetails.isVetoProposal) {
    const details = new VetoProposalDetails()
    const specificDetails = proposalDetails.asVetoProposal
    details.proposalId = specificDetails.toString()
    return details
  }
  // UpdateChannelPayoutsProposalDetails
  else if (proposalDetails.isUpdateChannelPayouts) {
    const details = new UpdateChannelPayoutsProposalDetails()
    const specificDetails = proposalDetails.asUpdateChannelPayouts

    details.commitment = unwrap(specificDetails.commitment)?.toString()
    details.minCashoutAllowed = whenDef(unwrap(specificDetails.minCashoutAllowed), asBN)
    details.maxCashoutAllowed = whenDef(unwrap(specificDetails.maxCashoutAllowed), asBN)
    details.channelCashoutsEnabled = unwrap(specificDetails.channelCashoutsEnabled)?.valueOf()

    const asPayload = unwrap(specificDetails.payload)?.objectCreationParams
    details.payloadHash = asPayload && bytesToString(asPayload.ipfsContentId)

    return details
  }
  // UpdateGlobalNftLimitProposalDetails
  else if (proposalDetails.isUpdateGlobalNftLimit) {
    const details = new UpdateGlobalNftLimitProposalDetails()
    const specificDetails = proposalDetails.asUpdateGlobalNftLimit
    if (specificDetails[0].isDaily) {
      details.newDailyNftLimit = specificDetails[1].toNumber()
    } else {
      details.newWeeklyNftLimit = specificDetails[1].toNumber()
    }
    return details
  }
  // RuntimeProposalDetails
  else if (proposalDetails.isSetPalletFozenStatus) {
    const details = new UpdatePalletFrozenStatusProposalDetails()
    const [frozen, pallet] = proposalDetails.asSetPalletFozenStatus
    details.frozen = frozen.isTrue
    details.pallet = pallet.toString()
    return details
  }
  // DecreaseCouncilBudgetProposalDetails
  else if (proposalDetails.isDecreaseCouncilBudget) {
    const details = new DecreaseCouncilBudgetProposalDetails()
    details.amount = new BN(proposalDetails.asDecreaseCouncilBudget.toString())
    return details
  }
  // UpdateTokenPalletTokenConstraints
  else if (proposalDetails.isUpdateTokenPalletTokenConstraints) {
    const details = new UpdateTokenPalletTokenConstraintsProposalDetails()
    const specificDetails = proposalDetails.asUpdateTokenPalletTokenConstraints

    details.maxYearlyRate = unwrap(specificDetails.maxYearlyRate)?.toNumber()
    details.minAmmSlope = whenDef(unwrap(specificDetails.minAmmSlope), asBN)
    details.minSaleDuration = unwrap(specificDetails.minSaleDuration)?.toNumber()
    details.minRevenueSplitDuration = unwrap(specificDetails.minRevenueSplitDuration)?.toNumber()
    details.minRevenueSplitTimeToStart = unwrap(specificDetails.minRevenueSplitTimeToStart)?.toNumber()
    details.salePlatformFee = unwrap(specificDetails.salePlatformFee)?.toNumber()
    details.ammBuyTxFees = unwrap(specificDetails.ammBuyTxFees)?.toNumber()
    details.ammSellTxFees = unwrap(specificDetails.ammSellTxFees)?.toNumber()
    details.bloatBond = whenDef(unwrap(specificDetails.bloatBond), asBN)
    return details
  }
  // SetEraPayoutDampingFactorProposalDetails
  else if (proposalDetails.isSetEraPayoutDampingFactor) {
    const details = new SetEraPayoutDampingFactorProposalDetails()
    details.dampingFactor = proposalDetails.asSetEraPayoutDampingFactor.toNumber()
    return details
  } else {
    unimplementedError(`Unsupported proposal details type: ${proposalDetails.type}`)
  }
}

async function setProposalStatus(
  event: SubstrateEvent,
  store: DatabaseManager,
  proposal: Proposal,
  status: typeof ProposalStatus
): Promise<void> {
  proposal.status = status
  proposal.statusSetAtBlock = event.blockNumber
  proposal.statusSetAtTime = new Date(event.blockTimestamp)
  if (
    ![ProposalStatusDeciding.name, ProposalStatusDormant.name, ProposalStatusGracing.name].includes(status.isTypeOf)
  ) {
    proposal.isFinalized = true
  }
  return store.save<Proposal>(proposal)
}

async function handleRuntimeUpgradeProposalExecution(event: SubstrateEvent, store: DatabaseManager): Promise<void> {
  const unfinalizedProposals = await store.getMany(Proposal, { where: { isFinalized: false } })
  await Promise.all(
    unfinalizedProposals.map((proposal) =>
      setProposalStatus(event, store, proposal, new ProposalStatusCanceledByRuntime())
    )
  )
}

export async function proposalsCodex_ProposalCreated({
  store,
  event,
  block,
}: EventContext & StoreContext): Promise<void> {
  const specVersion = block.runtimeVersion.specVersion
  const [proposalId, generalProposalParameters, runtimeProposalDetails, proposalThreadId] =
    Number(specVersion) < 2001
      ? new ProposalCreatedEvent_V1001(event).params
      : new ProposalCreatedEvent_V2003(event).params

  const eventTime = new Date(event.blockTimestamp)
  const proposalDetails = await parseProposalDetails(
    event,
    store,
    runtimeProposalDetails as RuntimeProposalDetails_V2003
  )

  const proposal = new Proposal({
    id: proposalId.toString(),
    details: proposalDetails,
    councilApprovals: 0,
    creator: new Membership({ id: generalProposalParameters.memberId.toString() }),
    title: bytesToString(generalProposalParameters.title),
    description: bytesToString(generalProposalParameters.description),
    exactExecutionBlock: generalProposalParameters.exactExecutionBlock.isSome
      ? toNumber(generalProposalParameters.exactExecutionBlock.unwrap(), INT32MAX)
      : undefined,
    stakingAccount: generalProposalParameters.stakingAccountId.toString(),
    status: new ProposalStatusDeciding(),
    isFinalized: false,
    statusSetAtBlock: event.blockNumber,
    statusSetAtTime: eventTime,
  })
  await store.save<Proposal>(proposal)

  // Thread is always created along with the proposal
  const proposalThread = new ProposalDiscussionThread({
    id: proposalThreadId.toString(),
    mode: new ProposalDiscussionThreadModeOpen(),
    proposal,
  })
  await store.save<ProposalDiscussionThread>(proposalThread)

  const proposalCreatedEvent = new ProposalCreatedEvent({
    ...genericEventFields(event),
    proposal: proposal,
  })
  await store.save<ProposalCreatedEvent>(proposalCreatedEvent)
}

export async function proposalsEngine_ProposalStatusUpdated({
  store,
  event,
}: EventContext & StoreContext): Promise<void> {
  const [proposalId, status] = new ProposalStatusUpdatedEvent_V1001(event).params
  const proposal = await getProposal(store, proposalId.toString())

  let newStatus: typeof ProposalIntermediateStatus
  if (status.isActive) {
    newStatus = new ProposalStatusDeciding()
  } else if (status.isPendingConstitutionality) {
    newStatus = new ProposalStatusDormant()
    ++proposal.councilApprovals
  } else if (status.isPendingExecution) {
    newStatus = new ProposalStatusGracing()
    ++proposal.councilApprovals
  } else {
    unimplementedError(`Unsupported proposal status: ${status.type}`)
  }

  const proposalStatusUpdatedEvent = new ProposalStatusUpdatedEvent({
    ...genericEventFields(event),
    newStatus,
    proposal,
  })
  await store.save<ProposalStatusUpdatedEvent>(proposalStatusUpdatedEvent)

  newStatus.proposalStatusUpdatedEventId = proposalStatusUpdatedEvent.id

  await setProposalStatus(event, store, proposal, newStatus)
}

export async function proposalsEngine_ProposalDecisionMade({
  store,
  event,
}: EventContext & StoreContext): Promise<void> {
  const [proposalId, decision] = new ProposalDecisionMadeEvent_V1001(event).params
  const proposal = await getProposal(store, proposalId.toString())

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
    unimplementedError(`Unexpected proposal decision: ${decision.type}`)
  }

  const proposalDecisionMadeEvent = new ProposalDecisionMadeEvent({
    ...genericEventFields(event),
    decisionStatus,
    proposal,
  })
  await store.save<ProposalDecisionMadeEvent>(proposalDecisionMadeEvent)

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
    ;(
      decisionStatus as
        | ProposalStatusCanceledByRuntime
        | ProposalStatusExpired
        | ProposalStatusRejected
        | ProposalStatusSlashed
        | ProposalStatusVetoed
    ).proposalDecisionMadeEventId = proposalDecisionMadeEvent.id
    await setProposalStatus(event, store, proposal, decisionStatus)
  }
}

export async function proposalsEngine_ProposalExecuted({ store, event }: EventContext & StoreContext): Promise<void> {
  const [proposalId, executionStatus] = new ProposalExecutedEvent_V1001(event).params
  const proposal = await getProposal(store, proposalId.toString())

  let newStatus: typeof ProposalExecutionStatus
  if (executionStatus.isExecuted) {
    newStatus = new ProposalStatusExecuted()
  } else if (executionStatus.isExecutionFailed) {
    const status = new ProposalStatusExecutionFailed()
    status.errorMessage = executionStatus.asExecutionFailed.error.toHuman() as string
    newStatus = status
  } else {
    unimplementedError(`Unsupported proposal execution status: ${executionStatus.type}`)
  }

  const proposalExecutedEvent = new ProposalExecutedEvent({
    ...genericEventFields(event),
    executionStatus: newStatus,
    proposal,
  })
  await store.save<ProposalExecutedEvent>(proposalExecutedEvent)

  newStatus.proposalExecutedEventId = proposalExecutedEvent.id
  await setProposalStatus(event, store, proposal, newStatus)

  if (
    newStatus.isTypeOf === ProposalStatusExecuted.name &&
    proposal.details.isTypeOf === RuntimeUpgradeProposalDetails.name
  ) {
    await handleRuntimeUpgradeProposalExecution(event, store)
  }
}

export async function proposalsEngine_Voted({ store, event }: EventContext & StoreContext): Promise<void> {
  const [memberId, proposalId, voteKind, rationaleBytes] = new ProposalVotedEvent_V1001(event).params
  const proposal = await getProposal(store, proposalId.toString())

  let vote: ProposalVoteKind
  if (voteKind.isApprove) {
    vote = ProposalVoteKind.APPROVE
  } else if (voteKind.isReject) {
    vote = ProposalVoteKind.REJECT
  } else if (voteKind.isSlash) {
    vote = ProposalVoteKind.SLASH
  } else {
    vote = ProposalVoteKind.ABSTAIN
  }

  const votedEvent = new ProposalVotedEvent({
    ...genericEventFields(event),
    proposal,
    voteKind: vote,
    voter: new Membership({ id: memberId.toString() }),
    votingRound: proposal.councilApprovals + 1,
    rationale: bytesToString(rationaleBytes),
  })

  await store.save<ProposalVotedEvent>(votedEvent)
}

export async function proposalsEngine_ProposalCancelled({ store, event }: EventContext & StoreContext): Promise<void> {
  const [, proposalId] = new ProposalCancelledEvent_V1001(event).params
  const proposal = await getProposal(store, proposalId.toString())

  const proposalCancelledEvent = new ProposalCancelledEvent({
    ...genericEventFields(event),
    proposal,
  })

  await store.save<ProposalCancelledEvent>(proposalCancelledEvent)

  const newStatus = new ProposalStatusCancelled()
  newStatus.cancelledInEventId = proposalCancelledEvent.id
  await setProposalStatus(event, store, proposal, newStatus)
}
