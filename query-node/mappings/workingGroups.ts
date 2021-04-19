/*
eslint-disable @typescript-eslint/naming-convention
*/
import { SubstrateEvent } from '@dzlzv/hydra-common'
import { DatabaseManager } from '@dzlzv/hydra-db-utils'
import { StorageWorkingGroup as WorkingGroups } from './generated/types'
import { ApplicationMetadata, OpeningMetadata } from '@joystream/metadata-protobuf'
import { Bytes } from '@polkadot/types'
import { createEvent, deserializeMetadata } from './common'
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
  Event,
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
} from 'query-node/dist/model'
import { createType } from '@joystream/types'

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

async function createOpeningMeta(db: DatabaseManager, metadataBytes: Bytes): Promise<WorkingGroupOpeningMetadata> {
  const metadata = await deserializeMetadata(OpeningMetadata, metadataBytes)
  if (!metadata) {
    // TODO: Use some defaults?
  }
  const {
    applicationFormQuestionsList,
    applicationDetails,
    description,
    expectedEndingTimestamp,
    hiringLimit,
    shortDescription,
  } = metadata!.toObject()

  const openingMetadata = new WorkingGroupOpeningMetadata({
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
    // TODO: Handle invalid state?
  }
  const questions = await getApplicationFormQuestions(db, application.opening.id)
  const { answersList } = metadata!.toObject()
  await Promise.all(
    answersList.slice(0, questions.length).map(async (answer, index) => {
      const applicationFormQuestionAnswer = new ApplicationFormQuestionAnswer({
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
  const metadata = await createOpeningMeta(db, metadataBytes)

  const opening = new WorkingGroupOpening({
    createdAt: new Date(event_.blockTimestamp.toNumber()),
    updatedAt: new Date(event_.blockTimestamp.toNumber()),
    createdAtBlock: event_.blockNumber,
    id: `${group.name}-${openingRuntimeId.toString()}`,
    runtimeId: openingRuntimeId.toNumber(),
    applications: [],
    group,
    metadata,
    rewardPerBlock: rewardPerBlock.unwrapOr(new BN(0)),
    stakeAmount: stakePolicy.stake_amount,
    unstakingPeriod: stakePolicy.leaving_unstaking_period.toNumber(),
    status: new OpeningStatusOpen(),
    type: openingType.isLeader ? WorkingGroupOpeningType.LEADER : WorkingGroupOpeningType.REGULAR,
  })

  await db.save<WorkingGroupOpening>(opening)

  const event = await createEvent(event_, EventType.OpeningAdded)
  const openingAddedEvent = new OpeningAddedEvent({
    event,
    group,
    opening,
  })

  await db.save<Event>(event)
  await db.save<OpeningAddedEvent>(openingAddedEvent)
}

export async function workingGroups_AppliedOnOpening(db: DatabaseManager, event_: SubstrateEvent): Promise<void> {
  event_.blockTimestamp = new BN(event_.blockTimestamp) // FIXME: Temporary fix for wrong blockTimestamp type
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
    createdAt: new Date(event_.blockTimestamp.toNumber()),
    updatedAt: new Date(event_.blockTimestamp.toNumber()),
    createdAtBlock: event_.blockNumber,
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

  const event = await createEvent(event_, EventType.AppliedOnOpening)
  const appliedOnOpeningEvent = new AppliedOnOpeningEvent({
    createdAt: new Date(event_.blockTimestamp.toNumber()),
    updatedAt: new Date(event_.blockTimestamp.toNumber()),
    event,
    group,
    opening: new WorkingGroupOpening({ id: openingDbId }),
    application,
  })

  await db.save<Event>(event)
  await db.save<AppliedOnOpeningEvent>(appliedOnOpeningEvent)
}

export async function workingGroups_OpeningFilled(db: DatabaseManager, event_: SubstrateEvent): Promise<void> {
  event_.blockTimestamp = new BN(event_.blockTimestamp) // FIXME: Temporary fix for wrong blockTimestamp type
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
  const event = await createEvent(event_, EventType.OpeningFilled)
  const openingFilledEvent = new OpeningFilledEvent({
    createdAt: new Date(event_.blockTimestamp.toNumber()),
    updatedAt: new Date(event_.blockTimestamp.toNumber()),
    event,
    group,
    opening,
  })

  await db.save<Event>(event)
  await db.save<OpeningFilledEvent>(openingFilledEvent)

  // Update applications and create new workers
  await Promise.all(
    (opening.applications || []).map(async (application) => {
      const isAccepted = acceptedApplicationIds.some((runtimeId) => runtimeId.toNumber() === application.runtimeId)
      application.status = isAccepted ? new ApplicationStatusAccepted() : new ApplicationStatusRejected()
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
          createdAt: new Date(event_.blockTimestamp.toNumber()),
          updatedAt: new Date(event_.blockTimestamp.toNumber()),
          id: `${group.name}-${workerRuntimeId.toString()}`,
          runtimeId: workerRuntimeId.toNumber(),
          hiredAtBlock: event_.blockNumber,
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
      }
      await db.save<WorkingGroupApplication>(application)
    })
  )

  // Set opening status
  const openingFilled = new OpeningStatusFilled()
  openingFilled.openingFilledEventId = openingFilledEvent.id
  opening.status = openingFilled

  await db.save<WorkingGroupOpening>(opening)
}

export async function workingGroups_LeaderSet(db: DatabaseManager, event_: SubstrateEvent): Promise<void> {
  // TBD
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
export async function workingGroups_ApplicationWithdrawn(db: DatabaseManager, event_: SubstrateEvent): Promise<void> {
  // TBD
}
export async function workingGroups_OpeningCanceled(db: DatabaseManager, event_: SubstrateEvent): Promise<void> {
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
