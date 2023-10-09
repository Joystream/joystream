/*
eslint-disable @typescript-eslint/naming-convention
*/
import { EventContext, StoreContext, DatabaseManager, SubstrateEvent, FindOneOptions } from '@joystream/hydra-common'

import {
  StorageWorkingGroup_BudgetSetEvent_V1001,
  StorageWorkingGroup_WorkerRewardAmountUpdatedEvent_V1001 as WorkingGroup_WorkerRewardAmountUpdatedEvent_V1001,
  StorageWorkingGroup_ApplicationWithdrawnEvent_V1001 as WorkingGroup_ApplicationWithdrawnEvent_V1001,
  StorageWorkingGroup_AppliedOnOpeningEvent_V1001 as WorkingGroup_AppliedOnOpeningEvent_V1001,
  StorageWorkingGroup_BudgetSpendingEvent_V1001 as WorkingGroup_BudgetSpendingEvent_V1001,
  StorageWorkingGroup_LeadRemarkedEvent_V1001 as WorkingGroup_LeadRemarkedEvent_V1001,
  StorageWorkingGroup_NewMissedRewardLevelReachedEvent_V1001 as WorkingGroup_NewMissedRewardLevelReachedEvent_V1001,
  StorageWorkingGroup_OpeningAddedEvent_V1001 as WorkingGroup_OpeningAddedEvent_V1001,
  StorageWorkingGroup_OpeningCanceledEvent_V1001 as WorkingGroup_OpeningCanceledEvent_V1001,
  StorageWorkingGroup_OpeningFilledEvent_V1001 as WorkingGroup_OpeningFilledEvent_V1001,
  StorageWorkingGroup_RewardPaidEvent_V1001 as WorkingGroup_RewardPaidEvent_V1001,
  StorageWorkingGroup_StakeDecreasedEvent_V1001 as WorkingGroup_StakeDecreasedEvent_V1001,
  StorageWorkingGroup_StakeIncreasedEvent_V1001 as WorkingGroup_StakeIncreasedEvent_V1001,
  StorageWorkingGroup_StakeSlashedEvent_V1001 as WorkingGroup_StakeSlashedEvent_V1001,
  StorageWorkingGroup_StatusTextChangedEvent_V1001 as WorkingGroup_StatusTextChangedEvent_V1001,
  StorageWorkingGroup_TerminatedWorkerEvent_V1001 as WorkingGroup_TerminatedWorkerEvent_V1001,
  StorageWorkingGroup_WorkerExitedEvent_V1001 as WorkingGroup_WorkerExitedEvent_V1001,
  StorageWorkingGroup_WorkerRemarkedEvent_V1001 as WorkingGroup_WorkerRemarkedEvent_V1001,
  StorageWorkingGroup_WorkerRewardAccountUpdatedEvent_V1001 as WorkingGroup_WorkerRewardAccountUpdatedEvent_V1001,
  StorageWorkingGroup_WorkerRoleAccountUpdatedEvent_V1001 as WorkingGroup_WorkerRoleAccountUpdatedEvent_V1001,
  StorageWorkingGroup_WorkerStartedLeavingEvent_V1001 as WorkingGroup_WorkerStartedLeavingEvent_V1001,
  StorageWorkingGroup_WorkingGroupBudgetFundedEvent_V1001 as WorkingGroup_WorkingGroupBudgetFundedEvent_V1001,
} from '../generated/types'
import {
  ApplicationMetadata,
  IAddUpcomingOpening,
  IOpeningMetadata,
  IRemoveUpcomingOpening,
  ISetGroupMetadata,
  IWorkingGroupMetadata,
  IWorkingGroupMetadataAction,
  OpeningMetadata,
  RemarkMetadataAction,
  WorkingGroupMetadataAction,
} from '@joystream/metadata-protobuf'
import { Bytes } from '@polkadot/types'
import {
  deserializeMetadata,
  bytesToString,
  genericEventFields,
  getWorker,
  WorkingGroupModuleName,
  toNumber,
  INT32MAX,
  inconsistentState,
  getWorkingGroupByName,
  getWorkingGroupLead,
  invalidMetadata,
  getMemberById,
} from './common'
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
  WorkerStatusLeaving,
  BudgetFundedEvent,
} from 'query-node/dist/model'
import { createType } from '@joystream/types'
import { DecodedMetadataObject } from '@joystream/metadata-protobuf/types'
import { isSet } from '@joystream/metadata-protobuf/utils'
import { moderatePost } from './forum'

// Reusable functions
async function getWorkingGroup(
  store: DatabaseManager,
  event: SubstrateEvent,
  relations: string[] = []
): Promise<WorkingGroup> {
  const [groupName] = event.name.split('.')

  return getWorkingGroupByName(store, groupName as WorkingGroupModuleName, relations)
}

async function getOpening(
  store: DatabaseManager,
  openingstoreId: string,
  relations: string[] = []
): Promise<WorkingGroupOpening> {
  const opening = await store.get(WorkingGroupOpening, { where: { id: openingstoreId }, relations })
  if (!opening) {
    return inconsistentState(`Opening not found by id ${openingstoreId}`)
  }

  return opening
}

async function getApplication(store: DatabaseManager, applicationstoreId: string): Promise<WorkingGroupApplication> {
  const application = await store.get(WorkingGroupApplication, { where: { id: applicationstoreId } })
  if (!application) {
    return inconsistentState(`Application not found by id`, applicationstoreId)
  }

  return application
}

async function getApplicationFormQuestions(
  store: DatabaseManager,
  openingstoreId: string
): Promise<ApplicationFormQuestion[]> {
  const openingWithQuestions = await getOpening(store, openingstoreId, [
    'metadata',
    'metadata.applicationFormQuestions',
  ])

  if (!openingWithQuestions) {
    return inconsistentState('Opening not found by id', openingstoreId)
  }
  if (!openingWithQuestions.metadata.applicationFormQuestions) {
    return inconsistentState('Application form questions not found for opening', openingstoreId)
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
  store: DatabaseManager,
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
    title,
  } = metadata

  const openingMetadata = new WorkingGroupOpeningMetadata({
    originallyValid,
    applicationDetails: applicationDetails || undefined,
    title: title || undefined,
    description: description || undefined,
    shortDescription: shortDescription || undefined,
    hiringLimit: hiringLimit || undefined,
    expectedEnding: expectedEndingTimestamp ? new Date(expectedEndingTimestamp * 1000) : undefined,
    applicationFormQuestions: [],
  })

  await store.save<WorkingGroupOpeningMetadata>(openingMetadata)

  await Promise.all(
    (applicationFormQuestions || []).map(async ({ question, type }, index) => {
      const applicationFormQuestion = new ApplicationFormQuestion({
        question: question || undefined,
        type: parseQuestionInputType(type),
        index,
        openingMetadata,
      })
      await store.save<ApplicationFormQuestion>(applicationFormQuestion)
      return applicationFormQuestion
    })
  )

  return openingMetadata
}

async function createApplicationQuestionAnswers(
  store: DatabaseManager,
  application: WorkingGroupApplication,
  metadataBytes: Bytes
) {
  const metadata = deserializeMetadata(ApplicationMetadata, metadataBytes)
  if (!metadata) {
    return
  }
  const questions = await getApplicationFormQuestions(store, application.opening.id)
  const { answers } = metadata
  await Promise.all(
    (answers || []).slice(0, questions.length).map(async (answer, index) => {
      const applicationFormQuestionAnswer = new ApplicationFormQuestionAnswer({
        application,
        question: questions[index],
        answer,
      })

      await store.save<ApplicationFormQuestionAnswer>(applicationFormQuestionAnswer)
      return applicationFormQuestionAnswer
    })
  )
}

async function handleAddUpcomingOpeningAction(
  store: DatabaseManager,
  event: SubstrateEvent,
  statusChangedEvent: StatusTextChangedEvent,
  action: DecodedMetadataObject<IAddUpcomingOpening>
): Promise<UpcomingOpeningAdded | InvalidActionMetadata> {
  const upcomingOpeningMeta = action.metadata || {}
  const group = await getWorkingGroup(store, event)
  const eventTime = new Date(event.blockTimestamp)
  const openingMeta = await await createWorkingGroupOpeningMetadata(
    store,
    eventTime,
    upcomingOpeningMeta.metadata || {}
  )
  const { rewardPerBlock, expectedStart, minApplicationStake } = upcomingOpeningMeta
  const upcomingOpening = new UpcomingWorkingGroupOpening({
    metadata: openingMeta,
    group,
    rewardPerBlock: isSet(rewardPerBlock) && parseInt(rewardPerBlock) ? new BN(rewardPerBlock) : undefined,
    expectedStart: expectedStart ? new Date(expectedStart * 1000) : undefined,
    stakeAmount: isSet(minApplicationStake) && parseInt(minApplicationStake) ? new BN(minApplicationStake) : undefined,
    createdInEvent: statusChangedEvent,
  })
  await store.save<UpcomingWorkingGroupOpening>(upcomingOpening)

  const result = new UpcomingOpeningAdded()
  result.upcomingOpeningId = upcomingOpening.id

  return result
}

async function handleRemoveUpcomingOpeningAction(
  store: DatabaseManager,
  action: IRemoveUpcomingOpening
): Promise<UpcomingOpeningRemoved | InvalidActionMetadata> {
  const { id } = action
  const upcomingOpening = await store.get(UpcomingWorkingGroupOpening, {
    where: { id },
  } as FindOneOptions<UpcomingWorkingGroupOpening>)
  let result: UpcomingOpeningRemoved | InvalidActionMetadata
  if (upcomingOpening) {
    result = new UpcomingOpeningRemoved()
    result.upcomingOpeningId = upcomingOpening.id
    await store.remove<UpcomingWorkingGroupOpening>(upcomingOpening)
  } else {
    const error = `Cannot remove upcoming opening: Entity by id ${id} not found!`
    console.error(error)
    result = new InvalidActionMetadata()
    result.reason = error
  }
  return result
}

async function handleSetWorkingGroupMetadataAction(
  store: DatabaseManager,
  event: SubstrateEvent,
  statusChangedEvent: StatusTextChangedEvent,
  action: ISetGroupMetadata
): Promise<WorkingGroupMetadataSet> {
  const { newMetadata } = action
  const group = await getWorkingGroup(store, event, ['metadata'])
  const oldMetadata = group.metadata
  const setNewOptionalString = (field: keyof IWorkingGroupMetadata) =>
    typeof newMetadata?.[field] === 'string' ? newMetadata[field] || undefined : oldMetadata?.[field]

  const newGroupMetadata = new WorkingGroupMetadata({
    setInEvent: statusChangedEvent,
    group,
    status: setNewOptionalString('status'),
    statusMessage: setNewOptionalString('statusMessage'),
    about: setNewOptionalString('about'),
    description: setNewOptionalString('description'),
  })
  await store.save<WorkingGroupMetadata>(newGroupMetadata)

  group.metadata = newGroupMetadata
  await store.save<WorkingGroup>(group)

  const result = new WorkingGroupMetadataSet()
  result.metadataId = newGroupMetadata.id

  return result
}

async function handleWorkingGroupMetadataAction(
  store: DatabaseManager,
  event: SubstrateEvent,
  statusChangedEvent: StatusTextChangedEvent,
  action: DecodedMetadataObject<IWorkingGroupMetadataAction>
): Promise<typeof WorkingGroupMetadataActionResult> {
  if (action.addUpcomingOpening) {
    return handleAddUpcomingOpeningAction(store, event, statusChangedEvent, action.addUpcomingOpening)
  } else if (action.removeUpcomingOpening) {
    return handleRemoveUpcomingOpeningAction(store, action.removeUpcomingOpening)
  } else if (action.setGroupMetadata) {
    return handleSetWorkingGroupMetadataAction(store, event, statusChangedEvent, action.setGroupMetadata)
  } else {
    const result = new InvalidActionMetadata()
    result.reason = 'No known action was provided'
    return result
  }
}

async function handleTerminatedWorker({ store, event }: EventContext & StoreContext): Promise<void> {
  const [workerId, optPenalty, optRationale] = new WorkingGroup_TerminatedWorkerEvent_V1001(event).params
  const group = await getWorkingGroup(store, event, ['leader'])
  const worker = await getWorker(store, group.name as WorkingGroupModuleName, workerId, [
    'application',
    'workinggroupleader',
  ])

  if (worker.isLead) {
    const terminatedLeaderEvent = new TerminatedLeaderEvent({
      ...genericEventFields(event),
      group,
      worker,
      penalty: optPenalty.unwrapOr(undefined),
      rationale: optRationale.isSome ? bytesToString(optRationale.unwrap()) : undefined,
    })
    await store.save<TerminatedLeaderEvent>(terminatedLeaderEvent)
  }

  const terminatedWorkerEvent = new TerminatedWorkerEvent({
    ...genericEventFields(event),
    group,
    worker,
    penalty: optPenalty.unwrapOr(undefined),
    rationale: optRationale.isSome ? bytesToString(optRationale.unwrap()) : undefined,
  })

  await store.save<TerminatedWorkerEvent>(terminatedWorkerEvent)

  const status = new WorkerStatusTerminated()
  status.terminatedWorkerEventId = terminatedWorkerEvent.id
  worker.status = status
  worker.stake = new BN(0)
  worker.rewardPerBlock = new BN(0)
  worker.isActive = isWorkerActive(worker)
  worker.workinggroupleader = [] // Make the worker not the group leader if there were

  await store.save<Worker>(worker)
}

export async function findLeaderSetEventByTxHash(store: DatabaseManager, txHash?: string): Promise<LeaderSetEvent> {
  const leaderSetEvent = await store.get(LeaderSetEvent, { where: { inExtrinsic: txHash } })

  if (!leaderSetEvent) {
    return inconsistentState(`LeaderSet event not found by tx hash`, txHash)
  }

  return leaderSetEvent
}

// expects `worker.application` to be available
function isWorkerActive(worker: Worker): boolean {
  return (
    worker.application.status.isTypeOf === 'ApplicationStatusAccepted' &&
    worker.status.isTypeOf === 'WorkerStatusActive'
  )
}

// Mapping functions
export async function workingGroups_OpeningAdded({ store, event }: EventContext & StoreContext): Promise<void> {
  const [openingRuntimeId, metadataBytes, openingType, stakePolicy, optRewardPerBlock] =
    new WorkingGroup_OpeningAddedEvent_V1001(event).params
  const group = await getWorkingGroup(store, event)
  const eventTime = new Date(event.blockTimestamp)

  const opening = new WorkingGroupOpening({
    id: `${group.name}-${openingRuntimeId.toString()}`,
    runtimeId: openingRuntimeId.toNumber(),
    applications: [],
    group,
    rewardPerBlock: optRewardPerBlock.unwrapOr(new BN(0)),
    stakeAmount: stakePolicy.stakeAmount,
    unstakingPeriod: toNumber(stakePolicy.leavingUnstakingPeriod, INT32MAX),
    status: new OpeningStatusOpen(),
    type: openingType.isLeader ? WorkingGroupOpeningType.LEADER : WorkingGroupOpeningType.REGULAR,
  })

  const metadata = await createWorkingGroupOpeningMetadata(store, eventTime, metadataBytes)
  opening.metadata = metadata

  await store.save<WorkingGroupOpening>(opening)

  const openingAddedEvent = new OpeningAddedEvent({
    ...genericEventFields(event),
    group,
    opening,
  })

  await store.save<OpeningAddedEvent>(openingAddedEvent)
}

export async function workingGroups_AppliedOnOpening({ store, event }: EventContext & StoreContext): Promise<void> {
  const [
    {
      openingId,
      description: metadataBytes,
      memberId,
      rewardAccountId,
      roleAccountId,
      stakeParameters: { stake, stakingAccountId },
    },
    applicationRuntimeId,
  ] = new WorkingGroup_AppliedOnOpeningEvent_V1001(event).params

  const group = await getWorkingGroup(store, event)
  const openingstoreId = `${group.name}-${openingId.toString()}`

  const application = new WorkingGroupApplication({
    id: `${group.name}-${applicationRuntimeId.toString()}`,
    runtimeId: applicationRuntimeId.toNumber(),
    opening: new WorkingGroupOpening({ id: openingstoreId }),
    applicant: new Membership({ id: memberId.toString() }),
    rewardAccount: rewardAccountId.toString(),
    roleAccount: roleAccountId.toString(),
    stakingAccount: stakingAccountId.toString(),
    status: new ApplicationStatusPending(),
    answers: [],
    stake,
  })

  await store.save<WorkingGroupApplication>(application)
  await createApplicationQuestionAnswers(store, application, metadataBytes)

  const appliedOnOpeningEvent = new AppliedOnOpeningEvent({
    ...genericEventFields(event),
    group,
    opening: new WorkingGroupOpening({ id: openingstoreId }),
    application,
  })

  await store.save<AppliedOnOpeningEvent>(appliedOnOpeningEvent)
}

export async function workingGroups_LeaderSet({ store, event }: EventContext & StoreContext): Promise<void> {
  const group = await getWorkingGroup(store, event)

  const leaderSetEvent = new LeaderSetEvent({
    ...genericEventFields(event),
    group,
  })

  await store.save<LeaderSetEvent>(leaderSetEvent)
}

export async function workingGroups_OpeningFilled({ store, event }: EventContext & StoreContext): Promise<void> {
  const [openingRuntimeId, applicationIdToWorkerIdMap, applicationIdsSet] = new WorkingGroup_OpeningFilledEvent_V1001(
    event
  ).params

  const group = await getWorkingGroup(store, event)
  const opening = await getOpening(store, `${group.name}-${openingRuntimeId.toString()}`, [
    'applications',
    'applications.applicant',
  ])
  const acceptedApplicationIds = createType('Vec<u64>', applicationIdsSet.toHex() as any)

  // Save the event
  const openingFilledEvent = new OpeningFilledEvent({
    ...genericEventFields(event),
    group,
    opening,
  })

  await store.save<OpeningFilledEvent>(openingFilledEvent)

  // Remove previous lead if necessary
  if (opening.type === WorkingGroupOpeningType.LEADER && acceptedApplicationIds.length > 0) {
    await removeIsLeadFromGroup(store, group.id)
  }

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
          await store.save<WorkingGroupApplication>(application)
          if (isAccepted) {
            // Cannot use "applicationIdToWorkerIdMap.get" here,
            // it only works if the passed instance is identical to BTreeMap key instance (=== instead of .eq)
            const [, workerRuntimeId] =
              Array.from(applicationIdToWorkerIdMap.entries()).find(
                ([applicationRuntimeId]) => applicationRuntimeId.toNumber() === application.runtimeId
              ) || []
            if (!workerRuntimeId) {
              return inconsistentState(
                'Fatal: No worker id found by accepted application when handling OpeningFilled event!',
                application.id
              )
            }

            const worker = new Worker({
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
            worker.isActive = isWorkerActive(worker)
            await store.save<Worker>(worker)
            return worker
          }
        })
    )
  ).filter((w) => w !== undefined) as Worker[]

  // Set opening status
  const openingFilled = new OpeningStatusFilled()
  openingFilled.openingFilledEventId = openingFilledEvent.id
  opening.status = openingFilled
  await store.save<WorkingGroupOpening>(opening)

  // Update working group and LeaderSetEvent if necessary
  if (opening.type === WorkingGroupOpeningType.LEADER && hiredWorkers.length) {
    group.leader = hiredWorkers[0]
    await store.save<WorkingGroup>(group)

    const leaderSetEvent = await findLeaderSetEventByTxHash(store, openingFilledEvent.inExtrinsic)
    leaderSetEvent.worker = hiredWorkers[0]
    await store.save<LeaderSetEvent>(leaderSetEvent)
  }
}

async function removeIsLeadFromGroup(store: DatabaseManager, groupId: string) {
  const groupWorkers = await store.getMany(Worker, {
    where: {
      group: { id: groupId },
      isLead: true,
    },
    relations: ['group'],
  })

  await Promise.all(
    groupWorkers.map((worker) => {
      worker.isLead = false
      return store.save<Worker>(worker)
    })
  )
}

export async function workingGroups_OpeningCanceled({ store, event }: EventContext & StoreContext): Promise<void> {
  const [openingRuntimeId] = new WorkingGroup_OpeningCanceledEvent_V1001(event).params

  const group = await getWorkingGroup(store, event)
  const opening = await getOpening(store, `${group.name}-${openingRuntimeId.toString()}`, ['applications'])

  // Create and save event
  const openingCanceledEvent = new OpeningCanceledEvent({
    ...genericEventFields(event),
    group,
    opening,
  })

  await store.save<OpeningCanceledEvent>(openingCanceledEvent)

  // Set opening status
  const openingCancelled = new OpeningStatusCancelled()
  openingCancelled.openingCanceledEventId = openingCanceledEvent.id
  opening.status = openingCancelled

  await store.save<WorkingGroupOpening>(opening)

  // Set applications status
  const applicationCancelled = new ApplicationStatusCancelled()
  applicationCancelled.openingCanceledEventId = openingCanceledEvent.id
  await Promise.all(
    (opening.applications || [])
      // Skip withdrawn applications
      .filter((application) => application.status.isTypeOf !== 'ApplicationStatusWithdrawn')
      .map(async (application) => {
        application.status = applicationCancelled
        await store.save<WorkingGroupApplication>(application)
      })
  )
}

export async function workingGroups_ApplicationWithdrawn({ store, event }: EventContext & StoreContext): Promise<void> {
  const [applicationRuntimeId] = new WorkingGroup_ApplicationWithdrawnEvent_V1001(event).params

  const group = await getWorkingGroup(store, event)
  const application = await getApplication(store, `${group.name}-${applicationRuntimeId.toString()}`)

  // Create and save event
  const applicationWithdrawnEvent = new ApplicationWithdrawnEvent({
    ...genericEventFields(event),
    group,
    application,
  })

  await store.save<ApplicationWithdrawnEvent>(applicationWithdrawnEvent)

  // Set application status
  const statusWithdrawn = new ApplicationStatusWithdrawn()
  statusWithdrawn.applicationWithdrawnEventId = applicationWithdrawnEvent.id
  application.status = statusWithdrawn

  await store.save<WorkingGroupApplication>(application)
}

export async function workingGroups_StatusTextChanged({ store, event }: EventContext & StoreContext): Promise<void> {
  const [, optBytes] = new WorkingGroup_StatusTextChangedEvent_V1001(event).params
  const group = await getWorkingGroup(store, event)

  // Since result cannot be empty at this point, but we already need to have an existing StatusTextChangedEvent
  // in order to be able to create UpcomingOpening.createdInEvent relation, we use a temporary "mock" result
  const mockResult = new InvalidActionMetadata()
  mockResult.reason = 'Metadata not yet processed'
  const statusTextChangedEvent = new StatusTextChangedEvent({
    ...genericEventFields(event),
    group,
    metadata: optBytes.isSome ? optBytes.unwrap().toString() : undefined,
    result: mockResult,
  })

  await store.save<StatusTextChangedEvent>(statusTextChangedEvent)

  let result: typeof WorkingGroupMetadataActionResult

  if (optBytes.isSome) {
    const metadata = deserializeMetadata(WorkingGroupMetadataAction, optBytes.unwrap())
    if (metadata) {
      result = await handleWorkingGroupMetadataAction(store, event, statusTextChangedEvent, metadata)
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
  await store.save<StatusTextChangedEvent>(statusTextChangedEvent)
}

export async function workingGroups_LeadRemarked({ store, event }: EventContext & StoreContext): Promise<void> {
  const [metadataByte] = new WorkingGroup_LeadRemarkedEvent_V1001(event).params
  const group = await getWorkingGroup(store, event)

  const metadata = deserializeMetadata(RemarkMetadataAction, metadataByte)
  if (metadata?.moderatePost) {
    if (group.name !== 'forumWorkingGroup') {
      return invalidMetadata(`The ${group.name} is incompatible with the remarked moderatePost`)
    }
    const { postId, rationale } = metadata.moderatePost
    const actor = await getWorkingGroupLead(store, group.name)

    await moderatePost(store, event, 'leadRemark', postId, actor, rationale)
  } else {
    return invalidMetadata('Unrecognized remarked action')
  }
}

export async function workingGroups_WorkerRemarked({ store, event }: EventContext & StoreContext): Promise<void> {
  const [workerId, metadataByte] = new WorkingGroup_WorkerRemarkedEvent_V1001(event).params
  const group = await getWorkingGroup(store, event)

  const metadata = deserializeMetadata(RemarkMetadataAction, metadataByte)
  if (metadata?.moderatePost) {
    if (group.name !== 'forumWorkingGroup') {
      return invalidMetadata(`The ${group.name} is incompatible with the remarked moderatePost`)
    }
    const { postId, rationale } = metadata.moderatePost
    const actor = await getWorker(store, group.name, workerId)

    await moderatePost(store, event, 'workerRemark', postId, actor, rationale)
  } else if (metadata?.verifyValidator) {
    if (group.name !== 'membershipWorkingGroup') {
      return invalidMetadata(`The ${group.name} cannot verify validator accounts`)
    }

    const actor = await getWorker(store, group.name, workerId)
    if (actor === undefined) {
      return invalidMetadata(`${actor} is not an membership account`)
    }

    const memberId = createType('u64', Number(metadata.verifyValidator.memberId))
    const member = await getMemberById(store, memberId, ['metadata'])

    member.metadata.isVerifiedValidator = true
    await store.save<Membership>(member)
  } else {
    return invalidMetadata('Unrecognized remarked action')
  }
}

export async function workingGroups_WorkerRoleAccountUpdated({
  store,
  event,
}: EventContext & StoreContext): Promise<void> {
  const [workerId, accountId] = new WorkingGroup_WorkerRoleAccountUpdatedEvent_V1001(event).params
  const group = await getWorkingGroup(store, event)
  const worker = await getWorker(store, group.name as WorkingGroupModuleName, workerId)

  const workerRoleAccountUpdatedEvent = new WorkerRoleAccountUpdatedEvent({
    ...genericEventFields(event),
    group,
    worker,
    newRoleAccount: accountId.toString(),
  })

  await store.save<WorkerRoleAccountUpdatedEvent>(workerRoleAccountUpdatedEvent)

  worker.roleAccount = accountId.toString()

  await store.save<Worker>(worker)
}

export async function workingGroups_WorkerRewardAccountUpdated({
  store,
  event,
}: EventContext & StoreContext): Promise<void> {
  const [workerId, accountId] = new WorkingGroup_WorkerRewardAccountUpdatedEvent_V1001(event).params
  const group = await getWorkingGroup(store, event)
  const worker = await getWorker(store, group.name as WorkingGroupModuleName, workerId)

  const workerRewardAccountUpdatedEvent = new WorkerRewardAccountUpdatedEvent({
    ...genericEventFields(event),
    group,
    worker,
    newRewardAccount: accountId.toString(),
  })

  await store.save<WorkerRoleAccountUpdatedEvent>(workerRewardAccountUpdatedEvent)

  worker.rewardAccount = accountId.toString()

  await store.save<Worker>(worker)
}

export async function workingGroups_StakeIncreased({ store, event }: EventContext & StoreContext): Promise<void> {
  const [workerId, increaseAmount] = new WorkingGroup_StakeIncreasedEvent_V1001(event).params
  const group = await getWorkingGroup(store, event)
  const worker = await getWorker(store, group.name as WorkingGroupModuleName, workerId)

  const stakeIncreasedEvent = new StakeIncreasedEvent({
    ...genericEventFields(event),
    group,
    worker,
    amount: increaseAmount,
  })

  await store.save<StakeIncreasedEvent>(stakeIncreasedEvent)

  worker.stake = worker.stake.add(increaseAmount)

  await store.save<Worker>(worker)
}

export async function workingGroups_RewardPaid({ store, event }: EventContext & StoreContext): Promise<void> {
  const [workerId, rewardAccountId, amount, rewardPaymentType] = new WorkingGroup_RewardPaidEvent_V1001(event).params
  const group = await getWorkingGroup(store, event)
  const worker = await getWorker(store, group.name as WorkingGroupModuleName, workerId)

  const rewardPaidEvent = new RewardPaidEvent({
    ...genericEventFields(event),
    group,
    worker,
    amount,
    rewardAccount: rewardAccountId.toString(),
    paymentType: rewardPaymentType.isRegularReward ? RewardPaymentType.REGULAR : RewardPaymentType.MISSED,
  })

  await store.save<RewardPaidEvent>(rewardPaidEvent)

  // Update group budget
  group.budget = group.budget.sub(amount)

  await store.save<WorkingGroup>(group)
}

export async function workingGroups_NewMissedRewardLevelReached({
  store,
  event,
}: EventContext & StoreContext): Promise<void> {
  const [workerId, newMissedRewardAmountOpt] = new WorkingGroup_NewMissedRewardLevelReachedEvent_V1001(event).params
  const group = await getWorkingGroup(store, event)
  const worker = await getWorker(store, group.name as WorkingGroupModuleName, workerId)

  const newMissedRewardLevelReachedEvent = new NewMissedRewardLevelReachedEvent({
    ...genericEventFields(event),
    group,
    worker,
    newMissedRewardAmount: newMissedRewardAmountOpt.unwrapOr(new BN(0)),
  })

  await store.save<NewMissedRewardLevelReachedEvent>(newMissedRewardLevelReachedEvent)

  // Update worker
  worker.missingRewardAmount = newMissedRewardAmountOpt.unwrapOr(undefined)

  await store.save<Worker>(worker)
}

export async function workingGroups_WorkerExited({ store, event }: EventContext & StoreContext): Promise<void> {
  const [workerId] = new WorkingGroup_WorkerExitedEvent_V1001(event).params
  const group = await getWorkingGroup(store, event)
  const worker = await getWorker(store, group.name as WorkingGroupModuleName, workerId, ['application'])

  const workerExitedEvent = new WorkerExitedEvent({
    ...genericEventFields(event),
    group,
    worker,
  })

  await store.save<WorkerExitedEvent>(workerExitedEvent)

  const newStatus = new WorkerStatusLeft()
  newStatus.workerStartedLeavingEventId = (worker.status as WorkerStatusLeaving).workerStartedLeavingEventId
  newStatus.workerExitedEventId = workerExitedEvent.id

  worker.status = newStatus
  worker.stake = new BN(0)
  worker.rewardPerBlock = new BN(0)
  worker.missingRewardAmount = undefined
  worker.isActive = isWorkerActive(worker)

  await store.save<Worker>(worker)
}

export async function workingGroups_LeaderUnset({ store, event }: EventContext & StoreContext): Promise<void> {
  const group = await getWorkingGroup(store, event, ['leader'])

  const leaderUnsetEvent = new LeaderUnsetEvent({
    ...genericEventFields(event),
    group,
    leader: group.leader,
  })

  await store.save<LeaderUnsetEvent>(leaderUnsetEvent)

  group.leader = undefined

  await store.save<WorkingGroup>(group)
}

export async function workingGroups_TerminatedWorker(ctx: EventContext & StoreContext): Promise<void> {
  await handleTerminatedWorker(ctx)
}
export async function workingGroups_TerminatedLeader(ctx: EventContext & StoreContext): Promise<void> {
  await handleTerminatedWorker(ctx)
}

export async function workingGroups_WorkerRewardAmountUpdated({
  store,
  event,
}: EventContext & StoreContext): Promise<void> {
  const [workerId, newRewardPerBlockOpt] = new WorkingGroup_WorkerRewardAmountUpdatedEvent_V1001(event).params
  const group = await getWorkingGroup(store, event)
  const worker = await getWorker(store, group.name as WorkingGroupModuleName, workerId)

  const workerRewardAmountUpdatedEvent = new WorkerRewardAmountUpdatedEvent({
    ...genericEventFields(event),
    group,
    worker,
    newRewardPerBlock: newRewardPerBlockOpt.unwrapOr(new BN(0)),
  })

  await store.save<WorkerRewardAmountUpdatedEvent>(workerRewardAmountUpdatedEvent)

  worker.rewardPerBlock = newRewardPerBlockOpt.unwrapOr(new BN(0))

  await store.save<Worker>(worker)
}

export async function workingGroups_StakeSlashed({ store, event }: EventContext & StoreContext): Promise<void> {
  const [workerId, slashedAmount, requestedAmount, optRationale] = new WorkingGroup_StakeSlashedEvent_V1001(event)
    .params
  const group = await getWorkingGroup(store, event)
  const worker = await getWorker(store, group.name as WorkingGroupModuleName, workerId)

  const workerStakeSlashedEvent = new StakeSlashedEvent({
    ...genericEventFields(event),
    group,
    worker,
    requestedAmount,
    slashedAmount,
    rationale: optRationale.isSome ? bytesToString(optRationale.unwrap()) : undefined,
  })

  await store.save<StakeSlashedEvent>(workerStakeSlashedEvent)

  worker.stake = worker.stake.sub(slashedAmount)

  await store.save<Worker>(worker)
}

export async function workingGroups_StakeDecreased({ store, event }: EventContext & StoreContext): Promise<void> {
  const [workerId, amount] = new WorkingGroup_StakeDecreasedEvent_V1001(event).params
  const group = await getWorkingGroup(store, event)
  const worker = await getWorker(store, group.name as WorkingGroupModuleName, workerId)

  const workerStakeDecreasedEvent = new StakeDecreasedEvent({
    ...genericEventFields(event),
    group,
    worker,
    amount,
  })

  await store.save<StakeDecreasedEvent>(workerStakeDecreasedEvent)

  worker.stake = worker.stake.sub(amount)

  await store.save<Worker>(worker)
}

export async function workingGroups_WorkerStartedLeaving({ store, event }: EventContext & StoreContext): Promise<void> {
  const [workerId, optRationale] = new WorkingGroup_WorkerStartedLeavingEvent_V1001(event).params
  const group = await getWorkingGroup(store, event)
  const worker = await getWorker(store, group.name as WorkingGroupModuleName, workerId, ['application'])

  const workerStartedLeavingEvent = new WorkerStartedLeavingEvent({
    ...genericEventFields(event),
    group,
    worker,
    rationale: optRationale.isSome ? bytesToString(optRationale.unwrap()) : undefined,
  })

  await store.save<WorkerStartedLeavingEvent>(workerStartedLeavingEvent)

  const status = new WorkerStatusLeaving()
  status.workerStartedLeavingEventId = workerStartedLeavingEvent.id
  worker.status = status
  worker.isActive = isWorkerActive(worker)

  await store.save<Worker>(worker)
}

export async function workingGroups_BudgetSet({ store, event }: EventContext & StoreContext): Promise<void> {
  const [newBudget] = new StorageWorkingGroup_BudgetSetEvent_V1001(event).params
  const group = await getWorkingGroup(store, event)

  const budgetSetEvent = new BudgetSetEvent({
    ...genericEventFields(event),
    group,
    newBudget,
  })

  await store.save<BudgetSetEvent>(budgetSetEvent)

  group.budget = newBudget

  await store.save<WorkingGroup>(group)
}

export async function workingGroups_BudgetSpending({ store, event }: EventContext & StoreContext): Promise<void> {
  const [reciever, amount, optRationale] = new WorkingGroup_BudgetSpendingEvent_V1001(event).params
  const group = await getWorkingGroup(store, event)

  const budgetSpendingEvent = new BudgetSpendingEvent({
    ...genericEventFields(event),
    group,
    amount,
    reciever: reciever.toString(),
    rationale: optRationale.isSome ? bytesToString(optRationale.unwrap()) : undefined,
  })

  await store.save<BudgetSpendingEvent>(budgetSpendingEvent)

  group.budget = group.budget.sub(amount)

  await store.save<WorkingGroup>(group)
}

export async function workingGroups_WorkingGroupBudgetFunded({
  store,
  event,
}: EventContext & StoreContext): Promise<void> {
  const [memberId, amount, rationale] = new WorkingGroup_WorkingGroupBudgetFundedEvent_V1001(event).params
  const group = await getWorkingGroup(store, event)

  const budgetFundedEvent = new BudgetFundedEvent({
    ...genericEventFields(event),
    group,
    member: new Membership({ id: memberId.toString() }),
    amount,
    rationale: bytesToString(rationale),
  })

  await store.save<BudgetFundedEvent>(budgetFundedEvent)

  group.budget = group.budget.add(amount)

  await store.save<WorkingGroup>(group)
}
