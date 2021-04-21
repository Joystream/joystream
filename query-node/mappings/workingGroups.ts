/*
eslint-disable @typescript-eslint/naming-convention
*/
import { SubstrateEvent } from '@dzlzv/hydra-common'
import { DatabaseManager } from '@dzlzv/hydra-db-utils'
import { StorageWorkingGroup as WorkingGroups } from './generated/types'
import { ApplicationMetadata, OpeningMetadata } from '@joystream/metadata-protobuf'
import { Bytes } from '@polkadot/types'
import { createEvent, deserializeMetadata, getOrCreateBlock } from './common'
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
} from 'query-node/dist/model'
import { createType } from '@joystream/types'
import _ from 'lodash'

// Shortcuts
type InputTypeMap = OpeningMetadata.ApplicationFormQuestion.InputTypeMap
const InputType = OpeningMetadata.ApplicationFormQuestion.InputType

// Reusable functions
async function getWorkingGroup(db: DatabaseManager, event_: SubstrateEvent): Promise<WorkingGroup> {
  const [groupName] = event_.name.split('.')
  const group = await db.get(WorkingGroup, { where: { name: groupName } })
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

function getDefaultOpeningMetadata(opening: WorkingGroupOpening): OpeningMetadata {
  const metadata = new OpeningMetadata()
  metadata.setShortDescription(
    `${_.startCase(opening.group.name)} ${
      opening.type === WorkingGroupOpeningType.REGULAR ? 'worker' : 'leader'
    } opening`
  )
  metadata.setDescription(
    `Apply to this opening in order to be considered for ${_.startCase(opening.group.name)} ${
      opening.type === WorkingGroupOpeningType.REGULAR ? 'worker' : 'leader'
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
  opening: WorkingGroupOpening,
  metadataBytes: Bytes
): Promise<WorkingGroupOpeningMetadata> {
  const deserializedMetadata = await deserializeMetadata(OpeningMetadata, metadataBytes)
  const metadata = deserializedMetadata || (await getDefaultOpeningMetadata(opening))
  const originallyValid = !!deserializedMetadata
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

  const metadata = await createOpeningMeta(db, event_, opening, metadataBytes)
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

export async function workingGroups_WorkerRoleAccountUpdated(
  db: DatabaseManager,
  event_: SubstrateEvent
): Promise<void> {
  // TBD
}
export async function workingGroups_LeaderUnset(db: DatabaseManager, event_: SubstrateEvent): Promise<void> {
  // TBD
}
export async function workingGroups_WorkerExited(db: DatabaseManager, event_: SubstrateEvent): Promise<void> {
  // TBD
}
export async function workingGroups_TerminatedWorker(db: DatabaseManager, event_: SubstrateEvent): Promise<void> {
  // TBD
}
export async function workingGroups_TerminatedLeader(db: DatabaseManager, event_: SubstrateEvent): Promise<void> {
  // TBD
}
export async function workingGroups_StakeSlashed(db: DatabaseManager, event_: SubstrateEvent): Promise<void> {
  // TBD
}
export async function workingGroups_StakeDecreased(db: DatabaseManager, event_: SubstrateEvent): Promise<void> {
  // TBD
}
export async function workingGroups_StakeIncreased(db: DatabaseManager, event_: SubstrateEvent): Promise<void> {
  // TBD
}
export async function workingGroups_BudgetSet(db: DatabaseManager, event_: SubstrateEvent): Promise<void> {
  // TBD
}
export async function workingGroups_WorkerRewardAccountUpdated(
  db: DatabaseManager,
  event_: SubstrateEvent
): Promise<void> {
  // TBD
}
export async function workingGroups_WorkerRewardAmountUpdated(
  db: DatabaseManager,
  event_: SubstrateEvent
): Promise<void> {
  // TBD
}
export async function workingGroups_StatusTextChanged(db: DatabaseManager, event_: SubstrateEvent): Promise<void> {
  // TBD
}
export async function workingGroups_BudgetSpending(db: DatabaseManager, event_: SubstrateEvent): Promise<void> {
  // TBD
}
