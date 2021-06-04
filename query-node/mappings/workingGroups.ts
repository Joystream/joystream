/*
eslint-disable @typescript-eslint/naming-convention
*/
import { SubstrateEvent, DatabaseManager } from '@dzlzv/hydra-common'
import { StorageWorkingGroup as WorkingGroups } from './generated/types'
import {
  ApplicationMetadata,
  IAddUpcomingOpening,
  IOpeningMetadata,
  IRemoveUpcomingOpening,
  ISetGroupMetadata,
  IWorkingGroupMetadata,
  IWorkingGroupMetadataAction,
  OpeningMetadata,
  WorkingGroupMetadataAction,
} from '@joystream/metadata-protobuf'
import { Bytes } from '@polkadot/types'
import { deserializeMetadata, bytesToString, genericEventFields } from './common'
import BN from 'bn.js'
import {
  WorkingGroupOpening,
  OpeningAddedEvent,
  WorkingGroup,
  WorkingGroupOpeningMetadata,
  ApplicationFormQuestion,
  ApplicationFormQuestionType,
  OpeningStatusOpen,
  WorkingGroupOpeningType,
  WorkingGroupApplication,
  ApplicationFormQuestionAnswer,
  AppliedOnOpeningEvent,
  Membership,
  ApplicationStatusPending,
  ApplicationStatusAccepted,
  ApplicationStatusRejected,
  Worker,
  WorkerStatusActive,
  OpeningFilledEvent,
  OpeningStatusFilled,
  // LeaderSetEvent,
  OpeningCanceledEvent,
  OpeningStatusCancelled,
  ApplicationStatusCancelled,
  ApplicationWithdrawnEvent,
  ApplicationStatusWithdrawn,
  UpcomingWorkingGroupOpening,
  StatusTextChangedEvent,
  WorkingGroupMetadata,
  WorkingGroupMetadataSet,
  UpcomingOpeningRemoved,
  InvalidActionMetadata,
  WorkingGroupMetadataActionResult,
  UpcomingOpeningAdded,
  WorkerRoleAccountUpdatedEvent,
  WorkerRewardAccountUpdatedEvent,
  StakeIncreasedEvent,
  RewardPaidEvent,
  RewardPaymentType,
  NewMissedRewardLevelReachedEvent,
  WorkerExitedEvent,
  WorkerStatusLeft,
  WorkerStatusTerminated,
  TerminatedWorkerEvent,
  LeaderUnsetEvent,
  TerminatedLeaderEvent,
  WorkerRewardAmountUpdatedEvent,
  StakeSlashedEvent,
  StakeDecreasedEvent,
  WorkerStartedLeavingEvent,
  BudgetSetEvent,
  BudgetSpendingEvent,
  LeaderSetEvent,
  Event,
} from 'query-node/dist/model'
import { createType } from '@joystream/types'

// Reusable functions
async function getWorkingGroup(
  db: DatabaseManager,
  event_: SubstrateEvent,
  relations: string[] = []
): Promise<WorkingGroup> {
  const [groupName] = event_.name.split('.')
  const group = await db.get(WorkingGroup, { where: { name: groupName }, relations })
  if (!group) {
    throw new Error(`Working group ${groupName} not found!`)
  }

  return group
}

async function getOpening(
  db: DatabaseManager,
  openingDbId: string,
  relations: string[] = []
): Promise<WorkingGroupOpening> {
  const opening = await db.get(WorkingGroupOpening, { where: { id: openingDbId }, relations })
  if (!opening) {
    throw new Error(`Opening not found by id ${openingDbId}`)
  }

  return opening
}

async function getApplication(db: DatabaseManager, applicationDbId: string): Promise<WorkingGroupApplication> {
  const application = await db.get(WorkingGroupApplication, { where: { id: applicationDbId } })
  if (!application) {
    throw new Error(`Application not found by id ${applicationDbId}`)
  }

  return application
}

async function getWorker(db: DatabaseManager, workerDbId: string): Promise<Worker> {
  const worker = await db.get(Worker, { where: { id: workerDbId } })
  if (!worker) {
    throw new Error(`Worker not found by id ${workerDbId}`)
  }

  return worker
}

async function getApplicationFormQuestions(
  db: DatabaseManager,
  openingDbId: string
): Promise<ApplicationFormQuestion[]> {
  const openingWithQuestions = await getOpening(db, openingDbId, ['metadata', 'metadata.applicationFormQuestions'])

  if (!openingWithQuestions) {
    throw new Error(`Opening not found by id: ${openingDbId}`)
  }
  if (!openingWithQuestions.metadata.applicationFormQuestions) {
    throw new Error(`Application form questions not found for opening: ${openingDbId}`)
  }
  return openingWithQuestions.metadata.applicationFormQuestions
}

const InputTypeToApplicationFormQuestionType = {
  [OpeningMetadata.ApplicationFormQuestion.InputType.TEXT]: ApplicationFormQuestionType.TEXT,
  [OpeningMetadata.ApplicationFormQuestion.InputType.TEXTAREA]: ApplicationFormQuestionType.TEXTAREA,
}

function parseQuestionInputType(
  type?: OpeningMetadata.ApplicationFormQuestion.InputType | null
): ApplicationFormQuestionType {
  const validType: OpeningMetadata.ApplicationFormQuestion.InputType = type || 0
  return InputTypeToApplicationFormQuestionType[validType]
}

export async function createWorkingGroupOpeningMetadata(
  db: DatabaseManager,
  eventTime: Date,
  originalMeta: Bytes | IOpeningMetadata
): Promise<WorkingGroupOpeningMetadata> {
  let originallyValid: boolean
  let metadata: IOpeningMetadata
  if (originalMeta instanceof Bytes) {
    const deserializedMetadata = await deserializeMetadata(OpeningMetadata, originalMeta)
    metadata = deserializedMetadata || {}
    originallyValid = !!deserializedMetadata
  } else {
    metadata = originalMeta
    originallyValid = true
  }

  const {
    applicationFormQuestions,
    applicationDetails,
    description,
    expectedEndingTimestamp,
    hiringLimit,
    shortDescription,
  } = metadata

  const openingMetadata = new WorkingGroupOpeningMetadata({
    createdAt: eventTime,
    updatedAt: eventTime,
    originallyValid,
    applicationDetails: applicationDetails || undefined,
    description: description || undefined,
    shortDescription: shortDescription || undefined,
    hiringLimit: hiringLimit || undefined,
    expectedEnding: expectedEndingTimestamp ? new Date(expectedEndingTimestamp) : undefined,
    applicationFormQuestions: [],
  })

  await db.save<WorkingGroupOpeningMetadata>(openingMetadata)

  await Promise.all(
    (applicationFormQuestions || []).map(async ({ question, type }, index) => {
      const applicationFormQuestion = new ApplicationFormQuestion({
        createdAt: eventTime,
        updatedAt: eventTime,
        question: question || undefined,
        type: parseQuestionInputType(type),
        index,
        openingMetadata,
      })
      await db.save<ApplicationFormQuestion>(applicationFormQuestion)
      return applicationFormQuestion
    })
  )

  return openingMetadata
}

async function createApplicationQuestionAnswers(
  db: DatabaseManager,
  application: WorkingGroupApplication,
  metadataBytes: Bytes
) {
  const metadata = deserializeMetadata(ApplicationMetadata, metadataBytes)
  if (!metadata) {
    return
  }
  const questions = await getApplicationFormQuestions(db, application.opening.id)
  const { answers } = metadata
  await Promise.all(
    (answers || []).slice(0, questions.length).map(async (answer, index) => {
      const applicationFormQuestionAnswer = new ApplicationFormQuestionAnswer({
        createdAt: application.createdAt,
        updatedAt: application.updatedAt,
        application,
        question: questions[index],
        answer,
      })

      await db.save<ApplicationFormQuestionAnswer>(applicationFormQuestionAnswer)
      return applicationFormQuestionAnswer
    })
  )
}

async function handleAddUpcomingOpeningAction(
  db: DatabaseManager,
  event_: SubstrateEvent,
  statusChangedEvent: StatusTextChangedEvent,
  action: IAddUpcomingOpening
): Promise<UpcomingOpeningAdded | InvalidActionMetadata> {
  const upcomingOpeningMeta = action.metadata || {}
  const group = await getWorkingGroup(db, event_)
  const eventTime = new Date(event_.blockTimestamp)
  const openingMeta = await createWorkingGroupOpeningMetadata(db, eventTime, upcomingOpeningMeta.metadata || {})
  const { rewardPerBlock, expectedStart, minApplicationStake } = upcomingOpeningMeta
  const upcomingOpening = new UpcomingWorkingGroupOpening({
    createdAt: eventTime,
    updatedAt: eventTime,
    metadata: openingMeta,
    group,
    rewardPerBlock: rewardPerBlock?.toNumber() ? new BN(rewardPerBlock.toString()) : undefined,
    expectedStart: expectedStart ? new Date(expectedStart) : undefined,
    stakeAmount: minApplicationStake?.toNumber() ? new BN(minApplicationStake.toString()) : undefined,
    createdInEvent: statusChangedEvent,
  })
  await db.save<UpcomingWorkingGroupOpening>(upcomingOpening)

  const result = new UpcomingOpeningAdded()
  result.upcomingOpeningId = upcomingOpening.id

  return result
}

async function handleRemoveUpcomingOpeningAction(
  db: DatabaseManager,
  action: IRemoveUpcomingOpening
): Promise<UpcomingOpeningRemoved | InvalidActionMetadata> {
  const { id } = action
  const upcomingOpening = await db.get(UpcomingWorkingGroupOpening, { where: { id } })
  let result: UpcomingOpeningRemoved | InvalidActionMetadata
  if (upcomingOpening) {
    result = new UpcomingOpeningRemoved()
    result.upcomingOpeningId = upcomingOpening.id
    await db.remove<UpcomingWorkingGroupOpening>(upcomingOpening)
  } else {
    const error = `Cannot remove upcoming opening: Entity by id ${id} not found!`
    console.error(error)
    result = new InvalidActionMetadata()
    result.reason = error
  }
  return result
}

async function handleSetWorkingGroupMetadataAction(
  db: DatabaseManager,
  event_: SubstrateEvent,
  statusChangedEvent: StatusTextChangedEvent,
  action: ISetGroupMetadata
): Promise<WorkingGroupMetadataSet> {
  const { newMetadata } = action
  const group = await getWorkingGroup(db, event_, ['metadata'])
  const oldMetadata = group.metadata
  const eventTime = new Date(event_.blockTimestamp)
  const setNewOptionalString = (field: keyof IWorkingGroupMetadata) =>
    typeof newMetadata?.[field] === 'string' ? newMetadata[field] || undefined : oldMetadata?.[field]

  const newGroupMetadata = new WorkingGroupMetadata({
    createdAt: eventTime,
    updatedAt: eventTime,
    setInEvent: statusChangedEvent,
    group,
    status: setNewOptionalString('status'),
    statusMessage: setNewOptionalString('statusMessage'),
    about: setNewOptionalString('about'),
    description: setNewOptionalString('description'),
  })
  await db.save<WorkingGroupMetadata>(newGroupMetadata)

  group.metadata = newGroupMetadata
  group.updatedAt = eventTime
  await db.save<WorkingGroup>(group)

  const result = new WorkingGroupMetadataSet()
  result.metadataId = newGroupMetadata.id

  return result
}

async function handleWorkingGroupMetadataAction(
  db: DatabaseManager,
  event_: SubstrateEvent,
  statusChangedEvent: StatusTextChangedEvent,
  action: IWorkingGroupMetadataAction
): Promise<typeof WorkingGroupMetadataActionResult> {
  if (action.addUpcomingOpening) {
    return handleAddUpcomingOpeningAction(db, event_, statusChangedEvent, action.addUpcomingOpening)
  } else if (action.removeUpcomingOpening) {
    return handleRemoveUpcomingOpeningAction(db, action.removeUpcomingOpening)
  } else if (action.setGroupMetadata) {
    return handleSetWorkingGroupMetadataAction(db, event_, statusChangedEvent, action.setGroupMetadata)
  } else {
    const result = new InvalidActionMetadata()
    result.reason = 'No known action was provided'
    return result
  }
}

async function handleTerminatedWorker(db: DatabaseManager, event_: SubstrateEvent): Promise<void> {
  const [workerId, optPenalty, optRationale] = new WorkingGroups.TerminatedWorkerEvent(event_).params
  const group = await getWorkingGroup(db, event_)
  const worker = await getWorker(db, `${group.name}-${workerId.toString()}`)
  const eventTime = new Date(event_.blockTimestamp)

  const EventConstructor = worker.isLead ? TerminatedLeaderEvent : TerminatedWorkerEvent

  const terminatedEvent = new EventConstructor({
    ...genericEventFields(event_),
    group,
    worker,
    penalty: optPenalty.unwrapOr(undefined),
    rationale: optRationale.isSome ? bytesToString(optRationale.unwrap()) : undefined,
  })

  await db.save(terminatedEvent)

  const status = new WorkerStatusTerminated()
  status.terminatedWorkerEventId = terminatedEvent.id
  worker.status = status
  worker.stake = new BN(0)
  worker.rewardPerBlock = new BN(0)
  worker.updatedAt = eventTime

  await db.save<Worker>(worker)
}

export async function findLeaderSetEventByTxHash(db: DatabaseManager, txHash?: string): Promise<LeaderSetEvent> {
  const leaderSetEvent = await db.get(LeaderSetEvent, { where: { inExtrinsic: txHash } })

  if (!leaderSetEvent) {
    throw new Error(`LeaderSet event not found by tx hash: ${txHash}`)
  }

  return leaderSetEvent
}

// Mapping functions
export async function workingGroups_OpeningAdded(db: DatabaseManager, event_: SubstrateEvent): Promise<void> {
  const [
    openingRuntimeId,
    metadataBytes,
    openingType,
    stakePolicy,
    optRewardPerBlock,
  ] = new WorkingGroups.OpeningAddedEvent(event_).params
  const group = await getWorkingGroup(db, event_)
  const eventTime = new Date(event_.blockTimestamp)

  const opening = new WorkingGroupOpening({
    createdAt: eventTime,
    updatedAt: eventTime,
    id: `${group.name}-${openingRuntimeId.toString()}`,
    runtimeId: openingRuntimeId.toNumber(),
    applications: [],
    group,
    rewardPerBlock: optRewardPerBlock.unwrapOr(new BN(0)),
    stakeAmount: stakePolicy.stake_amount,
    unstakingPeriod: stakePolicy.leaving_unstaking_period.toNumber(),
    status: new OpeningStatusOpen(),
    type: openingType.isLeader ? WorkingGroupOpeningType.LEADER : WorkingGroupOpeningType.REGULAR,
  })

  const metadata = await createWorkingGroupOpeningMetadata(db, eventTime, metadataBytes)
  opening.metadata = metadata

  await db.save<WorkingGroupOpening>(opening)

  const openingAddedEvent = new OpeningAddedEvent({
    ...genericEventFields(event_),
    group,
    opening,
  })

  await db.save<OpeningAddedEvent>(openingAddedEvent)
}

export async function workingGroups_AppliedOnOpening(db: DatabaseManager, event_: SubstrateEvent): Promise<void> {
  const eventTime = new Date(event_.blockTimestamp)

  const [
    {
      opening_id: openingRuntimeId,
      description: metadataBytes,
      member_id: memberId,
      reward_account_id: rewardAccount,
      role_account_id: roleAccout,
      stake_parameters: { stake, staking_account_id: stakingAccount },
    },
    applicationRuntimeId,
  ] = new WorkingGroups.AppliedOnOpeningEvent(event_).params

  const group = await getWorkingGroup(db, event_)
  const openingDbId = `${group.name}-${openingRuntimeId.toString()}`

  const application = new WorkingGroupApplication({
    createdAt: eventTime,
    updatedAt: eventTime,
    id: `${group.name}-${applicationRuntimeId.toString()}`,
    runtimeId: applicationRuntimeId.toNumber(),
    opening: new WorkingGroupOpening({ id: openingDbId }),
    applicant: new Membership({ id: memberId.toString() }),
    rewardAccount: rewardAccount.toString(),
    roleAccount: roleAccout.toString(),
    stakingAccount: stakingAccount.toString(),
    status: new ApplicationStatusPending(),
    answers: [],
    stake,
  })

  await db.save<WorkingGroupApplication>(application)
  await createApplicationQuestionAnswers(db, application, metadataBytes)

  const appliedOnOpeningEvent = new AppliedOnOpeningEvent({
    ...genericEventFields(event_),
    group,
    opening: new WorkingGroupOpening({ id: openingDbId }),
    application,
  })

  await db.save<AppliedOnOpeningEvent>(appliedOnOpeningEvent)
}

export async function workingGroups_LeaderSet(db: DatabaseManager, event_: SubstrateEvent): Promise<void> {
  const group = await getWorkingGroup(db, event_)

  const leaderSetEvent = new LeaderSetEvent({
    ...genericEventFields(event_),
    group,
  })

  await db.save<LeaderSetEvent>(leaderSetEvent)
}

export async function workingGroups_OpeningFilled(db: DatabaseManager, event_: SubstrateEvent): Promise<void> {
  const eventTime = new Date(event_.blockTimestamp)

  const [openingRuntimeId, applicationIdToWorkerIdMap, applicationIdsSet] = new WorkingGroups.OpeningFilledEvent(
    event_
  ).params

  const group = await getWorkingGroup(db, event_)
  const opening = await getOpening(db, `${group.name}-${openingRuntimeId.toString()}`, [
    'applications',
    'applications.applicant',
  ])
  const acceptedApplicationIds = createType('Vec<ApplicationId>', applicationIdsSet.toHex() as any)

  // Save the event
  const openingFilledEvent = new OpeningFilledEvent({
    ...genericEventFields(event_),
    group,
    opening,
  })

  await db.save<OpeningFilledEvent>(openingFilledEvent)

  // Update applications and create new workers
  const hiredWorkers = (
    await Promise.all(
      (opening.applications || [])
        // Skip withdrawn applications
        .filter((application) => application.status.isTypeOf !== 'ApplicationStatusWithdrawn')
        .map(async (application) => {
          const isAccepted = acceptedApplicationIds.some((runtimeId) => runtimeId.toNumber() === application.runtimeId)
          const applicationStatus = isAccepted ? new ApplicationStatusAccepted() : new ApplicationStatusRejected()
          applicationStatus.openingFilledEventId = openingFilledEvent.id
          application.status = applicationStatus
          application.updatedAt = eventTime
          await db.save<WorkingGroupApplication>(application)
          if (isAccepted) {
            // Cannot use "applicationIdToWorkerIdMap.get" here,
            // it only works if the passed instance is identical to BTreeMap key instance (=== instead of .eq)
            const [, workerRuntimeId] =
              Array.from(applicationIdToWorkerIdMap.entries()).find(
                ([applicationRuntimeId]) => applicationRuntimeId.toNumber() === application.runtimeId
              ) || []
            if (!workerRuntimeId) {
              throw new Error(
                `Fatal: No worker id found by accepted application id ${application.id} when handling OpeningFilled event!`
              )
            }
            const worker = new Worker({
              createdAt: eventTime,
              updatedAt: eventTime,
              id: `${group.name}-${workerRuntimeId.toString()}`,
              runtimeId: workerRuntimeId.toNumber(),
              application,
              group,
              isLead: opening.type === WorkingGroupOpeningType.LEADER,
              membership: application.applicant,
              stake: application.stake,
              roleAccount: application.roleAccount,
              rewardAccount: application.rewardAccount,
              stakeAccount: application.stakingAccount,
              payouts: [],
              status: new WorkerStatusActive(),
              entry: openingFilledEvent,
              rewardPerBlock: opening.rewardPerBlock,
            })
            await db.save<Worker>(worker)
            return worker
          }
        })
    )
  ).filter((w) => w !== undefined) as Worker[]

  // Set opening status
  const openingFilled = new OpeningStatusFilled()
  openingFilled.openingFilledEventId = openingFilledEvent.id
  opening.status = openingFilled
  opening.updatedAt = eventTime
  await db.save<WorkingGroupOpening>(opening)

  // Update working group and LeaderSetEvent if necessary
  if (opening.type === WorkingGroupOpeningType.LEADER && hiredWorkers.length) {
    group.leader = hiredWorkers[0]
    group.updatedAt = eventTime
    await db.save<WorkingGroup>(group)

    const leaderSetEvent = await findLeaderSetEventByTxHash(db, openingFilledEvent.inExtrinsic)
    leaderSetEvent.worker = hiredWorkers[0]
    leaderSetEvent.updatedAt = eventTime
    await db.save<LeaderSetEvent>(leaderSetEvent)
  }
}

export async function workingGroups_OpeningCanceled(db: DatabaseManager, event_: SubstrateEvent): Promise<void> {
  const [openingRuntimeId] = new WorkingGroups.OpeningCanceledEvent(event_).params

  const group = await getWorkingGroup(db, event_)
  const opening = await getOpening(db, `${group.name}-${openingRuntimeId.toString()}`, ['applications'])
  const eventTime = new Date(event_.blockTimestamp)

  // Create and save event
  const openingCanceledEvent = new OpeningCanceledEvent({
    ...genericEventFields(event_),
    group,
    opening,
  })

  await db.save<OpeningCanceledEvent>(openingCanceledEvent)

  // Set opening status
  const openingCancelled = new OpeningStatusCancelled()
  openingCancelled.openingCanceledEventId = openingCanceledEvent.id
  opening.status = openingCancelled
  opening.updatedAt = eventTime

  await db.save<WorkingGroupOpening>(opening)

  // Set applications status
  const applicationCancelled = new ApplicationStatusCancelled()
  applicationCancelled.openingCanceledEventId = openingCanceledEvent.id
  await Promise.all(
    (opening.applications || [])
      // Skip withdrawn applications
      .filter((application) => application.status.isTypeOf !== 'ApplicationStatusWithdrawn')
      .map(async (application) => {
        application.status = applicationCancelled
        application.updatedAt = eventTime
        await db.save<WorkingGroupApplication>(application)
      })
  )
}

export async function workingGroups_ApplicationWithdrawn(db: DatabaseManager, event_: SubstrateEvent): Promise<void> {
  const [applicationRuntimeId] = new WorkingGroups.ApplicationWithdrawnEvent(event_).params

  const group = await getWorkingGroup(db, event_)
  const application = await getApplication(db, `${group.name}-${applicationRuntimeId.toString()}`)
  const eventTime = new Date(event_.blockTimestamp)

  // Create and save event
  const applicationWithdrawnEvent = new ApplicationWithdrawnEvent({
    ...genericEventFields(event_),
    group,
    application,
  })

  await db.save<ApplicationWithdrawnEvent>(applicationWithdrawnEvent)

  // Set application status
  const statusWithdrawn = new ApplicationStatusWithdrawn()
  statusWithdrawn.applicationWithdrawnEventId = applicationWithdrawnEvent.id
  application.status = statusWithdrawn
  application.updatedAt = eventTime

  await db.save<WorkingGroupApplication>(application)
}

export async function workingGroups_StatusTextChanged(db: DatabaseManager, event_: SubstrateEvent): Promise<void> {
  const [, optBytes] = new WorkingGroups.StatusTextChangedEvent(event_).params
  const group = await getWorkingGroup(db, event_)

  // Since result cannot be empty at this point, but we already need to have an existing StatusTextChangedEvent
  // in order to be able to create UpcomingOpening.createdInEvent relation, we use a temporary "mock" result
  const mockResult = new InvalidActionMetadata()
  mockResult.reason = 'Metadata not yet processed'
  const statusTextChangedEvent = new StatusTextChangedEvent({
    ...genericEventFields(event_),
    group,
    metadata: optBytes.isSome ? optBytes.unwrap().toString() : undefined,
    result: mockResult,
  })

  await db.save<StatusTextChangedEvent>(statusTextChangedEvent)

  let result: typeof WorkingGroupMetadataActionResult

  if (optBytes.isSome) {
    const metadata = deserializeMetadata(WorkingGroupMetadataAction, optBytes.unwrap())
    if (metadata) {
      result = await handleWorkingGroupMetadataAction(db, event_, statusTextChangedEvent, metadata)
    } else {
      result = new InvalidActionMetadata()
      result.reason = 'Invalid metadata: Cannot deserialize metadata binary'
    }
  } else {
    const error = 'No encoded metadata was provided'
    console.error(`StatusTextChanged event: ${error}`)
    result = new InvalidActionMetadata()
    result.reason = error
  }

  // Now we can set the "real" result
  statusTextChangedEvent.result = result
  await db.save<StatusTextChangedEvent>(statusTextChangedEvent)
}

export async function workingGroups_WorkerRoleAccountUpdated(
  db: DatabaseManager,
  event_: SubstrateEvent
): Promise<void> {
  const [workerId, accountId] = new WorkingGroups.WorkerRoleAccountUpdatedEvent(event_).params
  const group = await getWorkingGroup(db, event_)
  const worker = await getWorker(db, `${group.name}-${workerId.toString()}`)
  const eventTime = new Date(event_.blockTimestamp)

  const workerRoleAccountUpdatedEvent = new WorkerRoleAccountUpdatedEvent({
    ...genericEventFields(event_),
    group,
    worker,
    newRoleAccount: accountId.toString(),
  })

  await db.save<WorkerRoleAccountUpdatedEvent>(workerRoleAccountUpdatedEvent)

  worker.roleAccount = accountId.toString()
  worker.updatedAt = eventTime

  await db.save<Worker>(worker)
}

export async function workingGroups_WorkerRewardAccountUpdated(
  db: DatabaseManager,
  event_: SubstrateEvent
): Promise<void> {
  const [workerId, accountId] = new WorkingGroups.WorkerRewardAccountUpdatedEvent(event_).params
  const group = await getWorkingGroup(db, event_)
  const worker = await getWorker(db, `${group.name}-${workerId.toString()}`)
  const eventTime = new Date(event_.blockTimestamp)

  const workerRewardAccountUpdatedEvent = new WorkerRewardAccountUpdatedEvent({
    ...genericEventFields(event_),
    group,
    worker,
    newRewardAccount: accountId.toString(),
  })

  await db.save<WorkerRoleAccountUpdatedEvent>(workerRewardAccountUpdatedEvent)

  worker.rewardAccount = accountId.toString()
  worker.updatedAt = eventTime

  await db.save<Worker>(worker)
}

export async function workingGroups_StakeIncreased(db: DatabaseManager, event_: SubstrateEvent): Promise<void> {
  const [workerId, increaseAmount] = new WorkingGroups.StakeIncreasedEvent(event_).params
  const group = await getWorkingGroup(db, event_)
  const worker = await getWorker(db, `${group.name}-${workerId.toString()}`)
  const eventTime = new Date(event_.blockTimestamp)

  const stakeIncreasedEvent = new StakeIncreasedEvent({
    ...genericEventFields(event_),
    group,
    worker,
    amount: increaseAmount,
  })

  await db.save<StakeIncreasedEvent>(stakeIncreasedEvent)

  worker.stake = worker.stake.add(increaseAmount)
  worker.updatedAt = eventTime

  await db.save<Worker>(worker)
}

export async function workingGroups_RewardPaid(db: DatabaseManager, event_: SubstrateEvent): Promise<void> {
  const [workerId, rewardAccountId, amount, rewardPaymentType] = new WorkingGroups.RewardPaidEvent(event_).params
  const group = await getWorkingGroup(db, event_)
  const worker = await getWorker(db, `${group.name}-${workerId.toString()}`)
  const eventTime = new Date(event_.blockTimestamp)

  const rewardPaidEvent = new RewardPaidEvent({
    ...genericEventFields(event_),
    group,
    worker,
    amount,
    rewardAccount: rewardAccountId.toString(),
    type: rewardPaymentType.isRegularReward ? RewardPaymentType.REGULAR : RewardPaymentType.MISSED,
  })

  await db.save<RewardPaidEvent>(rewardPaidEvent)

  // Update group budget
  group.budget = group.budget.sub(amount)
  group.updatedAt = eventTime

  await db.save<WorkingGroup>(group)
}

export async function workingGroups_NewMissedRewardLevelReached(
  db: DatabaseManager,
  event_: SubstrateEvent
): Promise<void> {
  const [workerId, newMissedRewardAmountOpt] = new WorkingGroups.NewMissedRewardLevelReachedEvent(event_).params
  const group = await getWorkingGroup(db, event_)
  const worker = await getWorker(db, `${group.name}-${workerId.toString()}`)
  const eventTime = new Date(event_.blockTimestamp)

  const newMissedRewardLevelReachedEvent = new NewMissedRewardLevelReachedEvent({
    ...genericEventFields(event_),
    group,
    worker,
    newMissedRewardAmount: newMissedRewardAmountOpt.unwrapOr(new BN(0)),
  })

  await db.save<NewMissedRewardLevelReachedEvent>(newMissedRewardLevelReachedEvent)

  // Update worker
  worker.missingRewardAmount = newMissedRewardAmountOpt.unwrapOr(undefined)
  worker.updatedAt = eventTime

  await db.save<Worker>(worker)
}

export async function workingGroups_WorkerExited(db: DatabaseManager, event_: SubstrateEvent): Promise<void> {
  const [workerId] = new WorkingGroups.WorkerExitedEvent(event_).params
  const group = await getWorkingGroup(db, event_)
  const worker = await getWorker(db, `${group.name}-${workerId.toString()}`)
  const eventTime = new Date(event_.blockTimestamp)

  const workerExitedEvent = new WorkerExitedEvent({
    ...genericEventFields(event_),
    group,
    worker,
  })

  await db.save<WorkerExitedEvent>(workerExitedEvent)
  ;(worker.status as WorkerStatusLeft).workerExitedEventId = workerExitedEvent.id
  worker.stake = new BN(0)
  worker.rewardPerBlock = new BN(0)
  worker.updatedAt = eventTime

  await db.save<Worker>(worker)
}

export async function workingGroups_LeaderUnset(db: DatabaseManager, event_: SubstrateEvent): Promise<void> {
  const group = await getWorkingGroup(db, event_)
  const eventTime = new Date(event_.blockTimestamp)

  const leaderUnsetEvent = new LeaderUnsetEvent({
    ...genericEventFields(event_),
    group,
    leader: group.leader,
  })

  await db.save<LeaderUnsetEvent>(leaderUnsetEvent)

  group.leader = undefined
  group.updatedAt = eventTime

  await db.save<WorkingGroup>(group)
}

export async function workingGroups_TerminatedWorker(db: DatabaseManager, event_: SubstrateEvent): Promise<void> {
  await handleTerminatedWorker(db, event_)
}
export async function workingGroups_TerminatedLeader(db: DatabaseManager, event_: SubstrateEvent): Promise<void> {
  await handleTerminatedWorker(db, event_)
}

export async function workingGroups_WorkerRewardAmountUpdated(
  db: DatabaseManager,
  event_: SubstrateEvent
): Promise<void> {
  const [workerId, newRewardPerBlockOpt] = new WorkingGroups.WorkerRewardAmountUpdatedEvent(event_).params
  const group = await getWorkingGroup(db, event_)
  const worker = await getWorker(db, `${group.name}-${workerId.toString()}`)
  const eventTime = new Date(event_.blockTimestamp)

  const workerRewardAmountUpdatedEvent = new WorkerRewardAmountUpdatedEvent({
    ...genericEventFields(event_),
    group,
    worker,
    newRewardPerBlock: newRewardPerBlockOpt.unwrapOr(new BN(0)),
  })

  await db.save<WorkerRewardAmountUpdatedEvent>(workerRewardAmountUpdatedEvent)

  worker.rewardPerBlock = newRewardPerBlockOpt.unwrapOr(new BN(0))
  worker.updatedAt = eventTime

  await db.save<Worker>(worker)
}

export async function workingGroups_StakeSlashed(db: DatabaseManager, event_: SubstrateEvent): Promise<void> {
  const [workerId, slashedAmount, requestedAmount, optRationale] = new WorkingGroups.StakeSlashedEvent(event_).params
  const group = await getWorkingGroup(db, event_)
  const worker = await getWorker(db, `${group.name}-${workerId.toString()}`)
  const eventTime = new Date(event_.blockTimestamp)

  const workerStakeSlashedEvent = new StakeSlashedEvent({
    ...genericEventFields(event_),
    group,
    worker,
    requestedAmount,
    slashedAmount,
    rationale: optRationale.isSome ? bytesToString(optRationale.unwrap()) : undefined,
  })

  await db.save<StakeSlashedEvent>(workerStakeSlashedEvent)

  worker.stake = worker.stake.sub(slashedAmount)
  worker.updatedAt = eventTime

  await db.save<Worker>(worker)
}

export async function workingGroups_StakeDecreased(db: DatabaseManager, event_: SubstrateEvent): Promise<void> {
  const [workerId, amount] = new WorkingGroups.StakeDecreasedEvent(event_).params
  const group = await getWorkingGroup(db, event_)
  const worker = await getWorker(db, `${group.name}-${workerId.toString()}`)
  const eventTime = new Date(event_.blockTimestamp)

  const workerStakeDecreasedEvent = new StakeDecreasedEvent({
    ...genericEventFields(event_),
    group,
    worker,
    amount,
  })

  await db.save<StakeDecreasedEvent>(workerStakeDecreasedEvent)

  worker.stake = worker.stake.sub(amount)
  worker.updatedAt = eventTime

  await db.save<Worker>(worker)
}

export async function workingGroups_WorkerStartedLeaving(db: DatabaseManager, event_: SubstrateEvent): Promise<void> {
  const [workerId, optRationale] = new WorkingGroups.WorkerStartedLeavingEvent(event_).params
  const group = await getWorkingGroup(db, event_)
  const worker = await getWorker(db, `${group.name}-${workerId.toString()}`)
  const eventTime = new Date(event_.blockTimestamp)

  const workerStartedLeavingEvent = new WorkerStartedLeavingEvent({
    ...genericEventFields(event_),
    group,
    worker,
    rationale: optRationale.isSome ? bytesToString(optRationale.unwrap()) : undefined,
  })

  await db.save<WorkerStartedLeavingEvent>(workerStartedLeavingEvent)

  const status = new WorkerStatusLeft()
  status.workerStartedLeavingEventId = workerStartedLeavingEvent.id
  worker.status = status
  worker.updatedAt = eventTime

  await db.save<Worker>(worker)
}

export async function workingGroups_BudgetSet(db: DatabaseManager, event_: SubstrateEvent): Promise<void> {
  const [newBudget] = new WorkingGroups.BudgetSetEvent(event_).params
  const group = await getWorkingGroup(db, event_)
  const eventTime = new Date(event_.blockTimestamp)

  const budgetSetEvent = new BudgetSetEvent({
    ...genericEventFields(event_),
    group,
    newBudget,
  })

  await db.save<BudgetSetEvent>(budgetSetEvent)

  group.budget = newBudget
  group.updatedAt = eventTime

  await db.save<WorkingGroup>(group)
}

export async function workingGroups_BudgetSpending(db: DatabaseManager, event_: SubstrateEvent): Promise<void> {
  const [reciever, amount, optRationale] = new WorkingGroups.BudgetSpendingEvent(event_).params
  const group = await getWorkingGroup(db, event_)
  const eventTime = new Date(event_.blockTimestamp)

  const budgetSpendingEvent = new BudgetSpendingEvent({
    ...genericEventFields(event_),
    group,
    amount,
    reciever: reciever.toString(),
    rationale: optRationale.isSome ? bytesToString(optRationale.unwrap()) : undefined,
  })

  await db.save<BudgetSpendingEvent>(budgetSpendingEvent)

  group.budget = group.budget.sub(amount)
  group.updatedAt = eventTime

  await db.save<WorkingGroup>(group)
}
