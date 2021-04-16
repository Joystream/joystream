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
} from 'query-node/dist/model'

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

async function getApplicationFormQuestions(db: DatabaseManager, openingId: string): Promise<ApplicationFormQuestion[]> {
  const openingWithQuestions = await db.get(WorkingGroupOpening, {
    where: { id: openingId },
    relations: ['metadata', 'metadata.applicationFormQuestions'],
  })
  if (!openingWithQuestions) {
    throw new Error(`Opening not found by id: ${openingId}`)
  }
  if (!openingWithQuestions.metadata.applicationFormQuestions) {
    throw new Error(`Application form questions not found for opening: ${openingId}`)
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
    openingId,
    openingType,
    stakePolicy,
  } = new WorkingGroups.OpeningAddedEvent(event_).data
  const group = await getWorkingGroup(db, event_)
  const metadata = await createOpeningMeta(db, metadataBytes)

  const opening = new WorkingGroupOpening({
    createdAt: new Date(event_.blockTimestamp.toNumber()),
    updatedAt: new Date(event_.blockTimestamp.toNumber()),
    createdAtBlock: event_.blockNumber,
    id: openingId.toString(),
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
    applicationId,
    applyOnOpeningParameters: {
      opening_id: openingId,
      description: metadataBytes,
      member_id: memberId,
      reward_account_id: rewardAccount,
      role_account_id: roleAccout,
      stake_parameters: { staking_account_id: stakingAccount },
    },
  } = new WorkingGroups.AppliedOnOpeningEvent(event_).data
  const group = await getWorkingGroup(db, event_)

  const application = new WorkingGroupApplication({
    createdAt: new Date(event_.blockTimestamp.toNumber()),
    updatedAt: new Date(event_.blockTimestamp.toNumber()),
    createdAtBlock: event_.blockNumber,
    id: applicationId.toString(),
    opening: new WorkingGroupOpening({ id: openingId.toString() }),
    applicant: new Membership({ id: memberId.toString() }),
    rewardAccount: rewardAccount.toString(),
    roleAccount: roleAccout.toString(),
    stakingAccount: stakingAccount.toString(),
    status: new ApplicationStatusPending(),
    answers: [],
  })

  await db.save<WorkingGroupApplication>(application)
  await createApplicationQuestionAnswers(db, application, metadataBytes)

  const event = await createEvent(event_, EventType.AppliedOnOpening)
  const appliedOnOpeningEvent = new AppliedOnOpeningEvent({
    createdAt: new Date(event_.blockTimestamp.toNumber()),
    updatedAt: new Date(event_.blockTimestamp.toNumber()),
    event,
    group,
    opening: new WorkingGroupOpening({ id: openingId.toString() }),
    application,
  })

  await db.save<Event>(event)
  await db.save<AppliedOnOpeningEvent>(appliedOnOpeningEvent)
}

export async function workingGroups_OpeningFilled(db: DatabaseManager, event_: SubstrateEvent): Promise<void> {
  // TBD
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
