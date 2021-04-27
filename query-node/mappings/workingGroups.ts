/*
eslint-disable @typescript-eslint/naming-convention
*/
import { SubstrateEvent } from '@dzlzv/hydra-common'
import { DatabaseManager } from '@dzlzv/hydra-db-utils'
import { StorageWorkingGroup as WorkingGroups } from './generated/types'
import {
  AddUpcomingOpening,
  ApplicationMetadata,
  OpeningMetadata,
  RemoveUpcomingOpening,
  SetGroupMetadata,
  WorkingGroupMetadataAction,
} from '@joystream/metadata-protobuf'
import { Bytes } from '@polkadot/types'
import { createEvent, deserializeMetadata, getOrCreateBlock, bytesToString } from './common'
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
  EventType,
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
} from 'query-node/dist/model'
import { createType } from '@joystream/types'
import _ from 'lodash'

// Shortcuts
type InputTypeMap = OpeningMetadata.ApplicationFormQuestion.InputTypeMap
const InputType = OpeningMetadata.ApplicationFormQuestion.InputType

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

function parseQuestionInputType(type: InputTypeMap[keyof InputTypeMap]) {
  if (type === InputType.TEXTAREA) {
    return ApplicationFormQuestionType.TEXTAREA
  }

  return ApplicationFormQuestionType.TEXT
}

function getDefaultOpeningMetadata(group: WorkingGroup, openingType: WorkingGroupOpeningType): OpeningMetadata {
  const metadata = new OpeningMetadata()
  metadata.setShortDescription(
    `${_.startCase(group.name)} ${openingType === WorkingGroupOpeningType.REGULAR ? 'worker' : 'leader'} opening`
  )
  metadata.setDescription(
    `Apply to this opening in order to be considered for ${_.startCase(group.name)} ${
      openingType === WorkingGroupOpeningType.REGULAR ? 'worker' : 'leader'
    } role!`
  )
  metadata.setApplicationDetails(`- Fill the application form`)
  const applicationFormQuestion = new OpeningMetadata.ApplicationFormQuestion()
  applicationFormQuestion.setQuestion('What makes you a good candidate?')
  applicationFormQuestion.setType(OpeningMetadata.ApplicationFormQuestion.InputType.TEXTAREA)
  metadata.addApplicationFormQuestions(applicationFormQuestion)

  return metadata
}

async function createOpeningMeta(
  db: DatabaseManager,
  event_: SubstrateEvent,
  group: WorkingGroup,
  openingType: WorkingGroupOpeningType,
  originalMeta: Bytes | OpeningMetadata
): Promise<WorkingGroupOpeningMetadata> {
  let originallyValid: boolean
  let metadata: OpeningMetadata
  if (originalMeta instanceof Bytes) {
    const deserializedMetadata = await deserializeMetadata(OpeningMetadata, originalMeta)
    metadata = deserializedMetadata || (await getDefaultOpeningMetadata(group, openingType))
    originallyValid = !!deserializedMetadata
  } else {
    metadata = originalMeta
    originallyValid = true
  }
  const eventTime = new Date(event_.blockTimestamp.toNumber())

  const {
    applicationFormQuestionsList,
    applicationDetails,
    description,
    expectedEndingTimestamp,
    hiringLimit,
    shortDescription,
  } = metadata.toObject()

  const openingMetadata = new WorkingGroupOpeningMetadata({
    createdAt: eventTime,
    updatedAt: eventTime,
    originallyValid,
    applicationDetails,
    description,
    shortDescription,
    hiringLimit,
    expectedEnding: new Date(expectedEndingTimestamp!),
    applicationFormQuestions: [],
  })

  await db.save<WorkingGroupOpeningMetadata>(openingMetadata)

  await Promise.all(
    applicationFormQuestionsList.map(async ({ question, type }, index) => {
      const applicationFormQuestion = new ApplicationFormQuestion({
        createdAt: eventTime,
        updatedAt: eventTime,
        question,
        type: parseQuestionInputType(type!),
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
  const { answersList } = metadata.toObject()
  await Promise.all(
    answersList.slice(0, questions.length).map(async (answer, index) => {
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
  action: AddUpcomingOpening
): Promise<UpcomingOpeningAdded> {
  const upcomingOpeningMeta = action.getMetadata().toObject()
  const group = await getWorkingGroup(db, event_)
  const eventTime = new Date(event_.blockTimestamp.toNumber())
  const openingMeta = await createOpeningMeta(
    db,
    event_,
    group,
    WorkingGroupOpeningType.REGULAR,
    action.getMetadata().getMetadata()
  )
  const upcomingOpening = new UpcomingWorkingGroupOpening({
    createdAt: eventTime,
    updatedAt: eventTime,
    metadata: openingMeta,
    group,
    rewardPerBlock: new BN(upcomingOpeningMeta.rewardPerBlock!),
    expectedStart: new Date(upcomingOpeningMeta.expectedStart!),
    stakeAmount: new BN(upcomingOpeningMeta.minApplicationStake!),
    createdInEvent: statusChangedEvent,
    createdAtBlock: await getOrCreateBlock(db, event_),
  })
  await db.save<UpcomingWorkingGroupOpening>(upcomingOpening)

  const result = new UpcomingOpeningAdded()
  result.upcomingOpeningId = upcomingOpening.id

  return result
}

async function handleRemoveUpcomingOpeningAction(
  db: DatabaseManager,
  action: RemoveUpcomingOpening
): Promise<UpcomingOpeningRemoved | InvalidActionMetadata> {
  const id = action.getId()
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
  action: SetGroupMetadata
): Promise<WorkingGroupMetadataSet> {
  const { newMetadata } = action.toObject()
  const group = await getWorkingGroup(db, event_, ['metadata'])
  const groupMetadata = group.metadata
  const eventTime = new Date(event_.blockTimestamp.toNumber())

  const newGroupMetadata = new WorkingGroupMetadata({
    ..._.merge(groupMetadata, newMetadata),
    id: undefined,
    createdAt: eventTime,
    updatedAt: eventTime,
    setAtBlock: await getOrCreateBlock(db, event_),
    setInEvent: statusChangedEvent,
    group,
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
  action: WorkingGroupMetadataAction
): Promise<typeof WorkingGroupMetadataActionResult> {
  switch (action.getActionCase()) {
    case WorkingGroupMetadataAction.ActionCase.ADD_UPCOMING_OPENING: {
      return handleAddUpcomingOpeningAction(db, event_, statusChangedEvent, action.getAddUpcomingOpening()!)
    }
    case WorkingGroupMetadataAction.ActionCase.REMOVE_UPCOMING_OPENING: {
      return handleRemoveUpcomingOpeningAction(db, action.getRemoveUpcomingOpening()!)
    }
    case WorkingGroupMetadataAction.ActionCase.SET_GROUP_METADATA: {
      return handleSetWorkingGroupMetadataAction(db, event_, statusChangedEvent, action.getSetGroupMetadata()!)
    }
  }
  const result = new InvalidActionMetadata()
  result.reason = 'Unexpected action type'
  return result
}

async function handleTerminatedWorker(db: DatabaseManager, event_: SubstrateEvent): Promise<void> {
  event_.blockTimestamp = new BN(event_.blockTimestamp) // FIXME: Temporary fix for wrong blockTimestamp type
  const { workerId, balance: optPenalty, optBytes: optRationale } = new WorkingGroups.TerminatedWorkerEvent(event_).data
  const group = await getWorkingGroup(db, event_)
  const worker = await getWorker(db, `${group.name}-${workerId.toString()}`)
  const eventTime = new Date(event_.blockTimestamp.toNumber())

  const EventConstructor = worker.isLead ? TerminatedLeaderEvent : TerminatedWorkerEvent
  const eventType = worker.isLead ? EventType.TerminatedLeader : EventType.TerminatedWorker

  const terminatedEvent = new EventConstructor({
    createdAt: eventTime,
    updatedAt: eventTime,
    group,
    event: await createEvent(db, event_, eventType),
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

// Mapping functions
export async function workingGroups_OpeningAdded(db: DatabaseManager, event_: SubstrateEvent): Promise<void> {
  event_.blockTimestamp = new BN(event_.blockTimestamp) // FIXME: Temporary fix for wrong blockTimestamp type
  const {
    balance: rewardPerBlock,
    bytes: metadataBytes,
    openingId: openingRuntimeId,
    openingType,
    stakePolicy,
  } = new WorkingGroups.OpeningAddedEvent(event_).data
  const group = await getWorkingGroup(db, event_)
  const eventTime = new Date(event_.blockTimestamp.toNumber())

  const opening = new WorkingGroupOpening({
    createdAt: eventTime,
    updatedAt: eventTime,
    createdAtBlock: await getOrCreateBlock(db, event_),
    id: `${group.name}-${openingRuntimeId.toString()}`,
    runtimeId: openingRuntimeId.toNumber(),
    applications: [],
    group,
    rewardPerBlock: rewardPerBlock.unwrapOr(new BN(0)),
    stakeAmount: stakePolicy.stake_amount,
    unstakingPeriod: stakePolicy.leaving_unstaking_period.toNumber(),
    status: new OpeningStatusOpen(),
    type: openingType.isLeader ? WorkingGroupOpeningType.LEADER : WorkingGroupOpeningType.REGULAR,
  })

  const metadata = await createOpeningMeta(db, event_, group, opening.type, metadataBytes)
  opening.metadata = metadata

  await db.save<WorkingGroupOpening>(opening)

  const event = await createEvent(db, event_, EventType.OpeningAdded)
  const openingAddedEvent = new OpeningAddedEvent({
    createdAt: eventTime,
    updatedAt: eventTime,
    event,
    group,
    opening,
  })

  await db.save<OpeningAddedEvent>(openingAddedEvent)
}

export async function workingGroups_AppliedOnOpening(db: DatabaseManager, event_: SubstrateEvent): Promise<void> {
  event_.blockTimestamp = new BN(event_.blockTimestamp) // FIXME: Temporary fix for wrong blockTimestamp type
  const eventTime = new Date(event_.blockTimestamp.toNumber())

  const {
    applicationId: applicationRuntimeId,
    applyOnOpeningParameters: {
      opening_id: openingRuntimeId,
      description: metadataBytes,
      member_id: memberId,
      reward_account_id: rewardAccount,
      role_account_id: roleAccout,
      stake_parameters: { stake, staking_account_id: stakingAccount },
    },
  } = new WorkingGroups.AppliedOnOpeningEvent(event_).data
  const group = await getWorkingGroup(db, event_)
  const openingDbId = `${group.name}-${openingRuntimeId.toString()}`

  const application = new WorkingGroupApplication({
    createdAt: eventTime,
    updatedAt: eventTime,
    createdAtBlock: await getOrCreateBlock(db, event_),
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

  const event = await createEvent(db, event_, EventType.AppliedOnOpening)
  const appliedOnOpeningEvent = new AppliedOnOpeningEvent({
    createdAt: eventTime,
    updatedAt: eventTime,
    event,
    group,
    opening: new WorkingGroupOpening({ id: openingDbId }),
    application,
  })

  await db.save<AppliedOnOpeningEvent>(appliedOnOpeningEvent)
}

export async function workingGroups_OpeningFilled(db: DatabaseManager, event_: SubstrateEvent): Promise<void> {
  event_.blockTimestamp = new BN(event_.blockTimestamp) // FIXME: Temporary fix for wrong blockTimestamp type
  const eventTime = new Date(event_.blockTimestamp.toNumber())

  const {
    openingId: openingRuntimeId,
    applicationId: applicationIdsSet,
    applicationIdToWorkerIdMap,
  } = new WorkingGroups.OpeningFilledEvent(event_).data

  const group = await getWorkingGroup(db, event_)
  const opening = await getOpening(db, `${group.name}-${openingRuntimeId.toString()}`, [
    'applications',
    'applications.applicant',
  ])
  const acceptedApplicationIds = createType('Vec<ApplicationId>', applicationIdsSet.toHex() as any)

  // Save the event
  const event = await createEvent(db, event_, EventType.OpeningFilled)
  const openingFilledEvent = new OpeningFilledEvent({
    createdAt: eventTime,
    updatedAt: eventTime,
    event,
    group,
    opening,
  })

  await db.save<OpeningFilledEvent>(openingFilledEvent)

  const hiredWorkers: Worker[] = []
  // Update applications and create new workers
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
            hiredAtBlock: await getOrCreateBlock(db, event_),
            hiredAtTime: new Date(event_.blockTimestamp.toNumber()),
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
          hiredWorkers.push(worker)
        }
        await db.save<WorkingGroupApplication>(application)
      })
  )

  // Set opening status
  const openingFilled = new OpeningStatusFilled()
  openingFilled.openingFilledEventId = openingFilledEvent.id
  opening.status = openingFilled
  opening.updatedAt = eventTime
  await db.save<WorkingGroupOpening>(opening)

  // Update working group if necessary
  if (opening.type === WorkingGroupOpeningType.LEADER && hiredWorkers.length) {
    group.leader = hiredWorkers[0]
    group.updatedAt = eventTime
    await db.save<WorkingGroup>(group)
  }
}

// FIXME: Currently this event cannot be handled directly, because the worker does not yet exist at the time when it is emitted
// export async function workingGroups_LeaderSet(db: DatabaseManager, event_: SubstrateEvent): Promise<void> {
//   event_.blockTimestamp = new BN(event_.blockTimestamp) // FIXME: Temporary fix for wrong blockTimestamp type
//   const { workerId: workerRuntimeId } = new WorkingGroups.LeaderSetEvent(event_).data

//   const group = await getWorkingGroup(db, event_)
//   const workerDbId = `${group.name}-${workerRuntimeId.toString()}`
//   const worker = new Worker({ id: workerDbId })
//   const eventTime = new Date(event_.blockTimestamp.toNumber())

//   // Create and save event
//   const event = createEvent(event_, EventType.LeaderSet)
//   const leaderSetEvent = new LeaderSetEvent({
//     createdAt: eventTime,
//     updatedAt: eventTime,
//     event,
//     group,
//     worker,
//   })

//   await db.save<Event>(event)
//   await db.save<LeaderSetEvent>(leaderSetEvent)
// }

export async function workingGroups_OpeningCanceled(db: DatabaseManager, event_: SubstrateEvent): Promise<void> {
  event_.blockTimestamp = new BN(event_.blockTimestamp) // FIXME: Temporary fix for wrong blockTimestamp type
  const { openingId: openingRuntimeId } = new WorkingGroups.OpeningCanceledEvent(event_).data

  const group = await getWorkingGroup(db, event_)
  const opening = await getOpening(db, `${group.name}-${openingRuntimeId.toString()}`, ['applications'])
  const eventTime = new Date(event_.blockTimestamp.toNumber())

  // Create and save event
  const event = await createEvent(db, event_, EventType.OpeningCanceled)
  const openingCanceledEvent = new OpeningCanceledEvent({
    createdAt: eventTime,
    updatedAt: eventTime,
    event,
    group,
    opening,
  })

  await db.save<OpeningCanceledEvent>(openingCanceledEvent)

  // Set opening status
  const openingCancelled = new OpeningStatusCancelled()
  openingCancelled.openingCancelledEventId = openingCanceledEvent.id
  opening.status = openingCancelled
  opening.updatedAt = eventTime

  await db.save<WorkingGroupOpening>(opening)

  // Set applications status
  const applicationCancelled = new ApplicationStatusCancelled()
  applicationCancelled.openingCancelledEventId = openingCanceledEvent.id
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
  event_.blockTimestamp = new BN(event_.blockTimestamp) // FIXME: Temporary fix for wrong blockTimestamp type
  const { applicationId: applicationRuntimeId } = new WorkingGroups.ApplicationWithdrawnEvent(event_).data

  const group = await getWorkingGroup(db, event_)
  const application = await getApplication(db, `${group.name}-${applicationRuntimeId.toString()}`)
  const eventTime = new Date(event_.blockTimestamp.toNumber())

  // Create and save event
  const event = await createEvent(db, event_, EventType.ApplicationWithdrawn)
  const applicationWithdrawnEvent = new ApplicationWithdrawnEvent({
    createdAt: eventTime,
    updatedAt: eventTime,
    event,
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
  event_.blockTimestamp = new BN(event_.blockTimestamp) // FIXME: Temporary fix for wrong blockTimestamp type
  const { optBytes } = new WorkingGroups.StatusTextChangedEvent(event_).data
  const group = await getWorkingGroup(db, event_)
  const eventTime = new Date(event_.blockTimestamp.toNumber())

  // Since result cannot be empty at this point, but we already need to have an existing StatusTextChangedEvent
  // in order to be able to create UpcomingOpening.createdInEvent relation, we use a temporary "mock" result
  const mockResult = new InvalidActionMetadata()
  mockResult.reason = 'Metadata not yet processed'
  const statusTextChangedEvent = new StatusTextChangedEvent({
    createdAt: eventTime,
    updatedAt: eventTime,
    group,
    event: await createEvent(db, event_, EventType.StatusTextChanged),
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
  event_.blockTimestamp = new BN(event_.blockTimestamp) // FIXME: Temporary fix for wrong blockTimestamp type
  const { workerId, accountId } = new WorkingGroups.WorkerRoleAccountUpdatedEvent(event_).data
  const group = await getWorkingGroup(db, event_)
  const worker = await getWorker(db, `${group.name}-${workerId.toString()}`)
  const eventTime = new Date(event_.blockTimestamp.toNumber())

  const workerRoleAccountUpdatedEvent = new WorkerRoleAccountUpdatedEvent({
    createdAt: eventTime,
    updatedAt: eventTime,
    group,
    event: await createEvent(db, event_, EventType.WorkerRoleAccountUpdated),
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
  event_.blockTimestamp = new BN(event_.blockTimestamp) // FIXME: Temporary fix for wrong blockTimestamp type
  const { workerId, accountId } = new WorkingGroups.WorkerRewardAccountUpdatedEvent(event_).data
  const group = await getWorkingGroup(db, event_)
  const worker = await getWorker(db, `${group.name}-${workerId.toString()}`)
  const eventTime = new Date(event_.blockTimestamp.toNumber())

  const workerRewardAccountUpdatedEvent = new WorkerRewardAccountUpdatedEvent({
    createdAt: eventTime,
    updatedAt: eventTime,
    group,
    event: await createEvent(db, event_, EventType.WorkerRewardAccountUpdated),
    worker,
    newRewardAccount: accountId.toString(),
  })

  await db.save<WorkerRoleAccountUpdatedEvent>(workerRewardAccountUpdatedEvent)

  worker.rewardAccount = accountId.toString()
  worker.updatedAt = eventTime

  await db.save<Worker>(worker)
}

export async function workingGroups_StakeIncreased(db: DatabaseManager, event_: SubstrateEvent): Promise<void> {
  event_.blockTimestamp = new BN(event_.blockTimestamp) // FIXME: Temporary fix for wrong blockTimestamp type
  const { workerId, balance: increaseAmount } = new WorkingGroups.StakeIncreasedEvent(event_).data
  const group = await getWorkingGroup(db, event_)
  const worker = await getWorker(db, `${group.name}-${workerId.toString()}`)
  const eventTime = new Date(event_.blockTimestamp.toNumber())

  const stakeIncreasedEvent = new StakeIncreasedEvent({
    createdAt: eventTime,
    updatedAt: eventTime,
    group,
    event: await createEvent(db, event_, EventType.StakeIncreased),
    worker,
    amount: increaseAmount,
  })

  await db.save<StakeIncreasedEvent>(stakeIncreasedEvent)

  worker.stake = worker.stake.add(increaseAmount)
  worker.updatedAt = eventTime

  await db.save<Worker>(worker)
}

export async function workingGroups_RewardPaid(db: DatabaseManager, event_: SubstrateEvent): Promise<void> {
  event_.blockTimestamp = new BN(event_.blockTimestamp) // FIXME: Temporary fix for wrong blockTimestamp type
  const {
    workerId,
    accountId: rewardAccountId,
    balance: amount,
    rewardPaymentType,
  } = new WorkingGroups.RewardPaidEvent(event_).data
  const group = await getWorkingGroup(db, event_)
  const worker = await getWorker(db, `${group.name}-${workerId.toString()}`)
  const eventTime = new Date(event_.blockTimestamp.toNumber())

  const rewardPaidEvent = new RewardPaidEvent({
    createdAt: eventTime,
    updatedAt: eventTime,
    group,
    event: await createEvent(db, event_, EventType.RewardPaid),
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
  event_.blockTimestamp = new BN(event_.blockTimestamp) // FIXME: Temporary fix for wrong blockTimestamp type
  const { workerId, balance: newMissedRewardAmountOpt } = new WorkingGroups.NewMissedRewardLevelReachedEvent(
    event_
  ).data
  const group = await getWorkingGroup(db, event_)
  const worker = await getWorker(db, `${group.name}-${workerId.toString()}`)
  const eventTime = new Date(event_.blockTimestamp.toNumber())

  const newMissedRewardLevelReachedEvent = new NewMissedRewardLevelReachedEvent({
    createdAt: eventTime,
    updatedAt: eventTime,
    group,
    event: await createEvent(db, event_, EventType.NewMissedRewardLevelReached),
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
  event_.blockTimestamp = new BN(event_.blockTimestamp) // FIXME: Temporary fix for wrong blockTimestamp type
  const { workerId } = new WorkingGroups.WorkerExitedEvent(event_).data
  const group = await getWorkingGroup(db, event_)
  const worker = await getWorker(db, `${group.name}-${workerId.toString()}`)
  const eventTime = new Date(event_.blockTimestamp.toNumber())

  const workerExitedEvent = new WorkerExitedEvent({
    createdAt: eventTime,
    updatedAt: eventTime,
    group,
    event: await createEvent(db, event_, EventType.WorkerExited),
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
  event_.blockTimestamp = new BN(event_.blockTimestamp) // FIXME: Temporary fix for wrong blockTimestamp type
  const group = await getWorkingGroup(db, event_)
  const eventTime = new Date(event_.blockTimestamp.toNumber())

  const leaderUnsetEvent = new LeaderUnsetEvent({
    createdAt: eventTime,
    updatedAt: eventTime,
    group,
    event: await createEvent(db, event_, EventType.LeaderUnset),
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
  event_.blockTimestamp = new BN(event_.blockTimestamp) // FIXME: Temporary fix for wrong blockTimestamp type
  const { workerId, balance: newRewardPerBlockOpt } = new WorkingGroups.WorkerRewardAmountUpdatedEvent(event_).data
  const group = await getWorkingGroup(db, event_)
  const worker = await getWorker(db, `${group.name}-${workerId.toString()}`)
  const eventTime = new Date(event_.blockTimestamp.toNumber())

  const workerRewardAmountUpdatedEvent = new WorkerRewardAmountUpdatedEvent({
    createdAt: eventTime,
    updatedAt: eventTime,
    group,
    event: await createEvent(db, event_, EventType.WorkerRewardAmountUpdated),
    worker,
    newRewardPerBlock: newRewardPerBlockOpt.unwrapOr(new BN(0)),
  })

  await db.save<WorkerRewardAmountUpdatedEvent>(workerRewardAmountUpdatedEvent)

  worker.rewardPerBlock = newRewardPerBlockOpt.unwrapOr(new BN(0))
  worker.updatedAt = eventTime

  await db.save<Worker>(worker)
}

export async function workingGroups_StakeSlashed(db: DatabaseManager, event_: SubstrateEvent): Promise<void> {
  event_.blockTimestamp = new BN(event_.blockTimestamp) // FIXME: Temporary fix for wrong blockTimestamp type
  const {
    workerId,
    balances: { 0: slashedAmount, 1: requestedAmount },
    optBytes: optRationale,
  } = new WorkingGroups.StakeSlashedEvent(event_).data
  const group = await getWorkingGroup(db, event_)
  const worker = await getWorker(db, `${group.name}-${workerId.toString()}`)
  const eventTime = new Date(event_.blockTimestamp.toNumber())

  const workerStakeSlashedEvent = new StakeSlashedEvent({
    createdAt: eventTime,
    updatedAt: eventTime,
    group,
    event: await createEvent(db, event_, EventType.StakeSlashed),
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
  event_.blockTimestamp = new BN(event_.blockTimestamp) // FIXME: Temporary fix for wrong blockTimestamp type
  const { workerId, balance: amount } = new WorkingGroups.StakeDecreasedEvent(event_).data
  const group = await getWorkingGroup(db, event_)
  const worker = await getWorker(db, `${group.name}-${workerId.toString()}`)
  const eventTime = new Date(event_.blockTimestamp.toNumber())

  const workerStakeDecreasedEvent = new StakeDecreasedEvent({
    createdAt: eventTime,
    updatedAt: eventTime,
    group,
    event: await createEvent(db, event_, EventType.StakeDecreased),
    worker,
    amount,
  })

  await db.save<StakeDecreasedEvent>(workerStakeDecreasedEvent)

  worker.stake = worker.stake.sub(amount)
  worker.updatedAt = eventTime

  await db.save<Worker>(worker)
}

export async function workingGroups_WorkerStartedLeaving(db: DatabaseManager, event_: SubstrateEvent): Promise<void> {
  event_.blockTimestamp = new BN(event_.blockTimestamp) // FIXME: Temporary fix for wrong blockTimestamp type
  const { workerId, optBytes: optRationale } = new WorkingGroups.WorkerStartedLeavingEvent(event_).data
  const group = await getWorkingGroup(db, event_)
  const worker = await getWorker(db, `${group.name}-${workerId.toString()}`)
  const eventTime = new Date(event_.blockTimestamp.toNumber())

  const workerStartedLeavingEvent = new WorkerStartedLeavingEvent({
    createdAt: eventTime,
    updatedAt: eventTime,
    group,
    event: await createEvent(db, event_, EventType.WorkerStartedLeaving),
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
  event_.blockTimestamp = new BN(event_.blockTimestamp) // FIXME: Temporary fix for wrong blockTimestamp type
  const { balance: newBudget } = new WorkingGroups.BudgetSetEvent(event_).data
  const group = await getWorkingGroup(db, event_)
  const eventTime = new Date(event_.blockTimestamp.toNumber())

  const budgetSetEvent = new BudgetSetEvent({
    createdAt: eventTime,
    updatedAt: eventTime,
    group,
    event: await createEvent(db, event_, EventType.BudgetSet),
    newBudget,
  })

  await db.save<BudgetSetEvent>(budgetSetEvent)

  group.budget = newBudget
  group.updatedAt = eventTime

  await db.save<WorkingGroup>(group)
}

export async function workingGroups_BudgetSpending(db: DatabaseManager, event_: SubstrateEvent): Promise<void> {
  event_.blockTimestamp = new BN(event_.blockTimestamp) // FIXME: Temporary fix for wrong blockTimestamp type
  const { accountId: reciever, balance: amount, optBytes: optRationale } = new WorkingGroups.BudgetSpendingEvent(
    event_
  ).data
  const group = await getWorkingGroup(db, event_)
  const eventTime = new Date(event_.blockTimestamp.toNumber())

  const budgetSpendingEvent = new BudgetSpendingEvent({
    createdAt: eventTime,
    updatedAt: eventTime,
    group,
    event: await createEvent(db, event_, EventType.BudgetSpending),
    amount,
    reciever: reciever.toString(),
    rationale: optRationale.isSome ? bytesToString(optRationale.unwrap()) : undefined,
  })

  await db.save<BudgetSpendingEvent>(budgetSpendingEvent)

  group.budget = group.budget.sub(amount)
  group.updatedAt = eventTime

  await db.save<WorkingGroup>(group)
}
