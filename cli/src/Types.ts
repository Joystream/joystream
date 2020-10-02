import BN from 'bn.js'
import { ElectionStage, Seat } from '@joystream/types/council'
import { Option, Text } from '@polkadot/types'
import { Constructor, Codec } from '@polkadot/types/types'
import { Struct, Vec } from '@polkadot/types/codec'
import { u32 } from '@polkadot/types/primitive'
import { BlockNumber, Balance, AccountId } from '@polkadot/types/interfaces'
import { DeriveBalancesAll } from '@polkadot/api-derive/types'
import { KeyringPair } from '@polkadot/keyring/types'
import { WorkerId, OpeningType } from '@joystream/types/working-group'
import { Membership, MemberId } from '@joystream/types/members'
import {
  GenericJoyStreamRoleSchema,
  JobSpecifics,
  ApplicationDetails,
  QuestionSections,
  QuestionSection,
  QuestionsFields,
  QuestionField,
  EntryInMembershipModuke,
  HiringProcess,
  AdditionalRolehiringProcessDetails,
  CreatorDetails,
} from '@joystream/types/hiring/schemas/role.schema.typings'
import ajv from 'ajv'
import { Opening, StakingPolicy, ApplicationStageKeys } from '@joystream/types/hiring'
import { Validator } from 'inquirer'
import { JoyStructCustom } from '@joystream/types/common'

// KeyringPair type extended with mandatory "meta.name"
// It's used for accounts/keys management within CLI.
// If not provided in the account json file, the meta.name value is set to "Unnamed Account"
export type NamedKeyringPair = KeyringPair & {
  meta: {
    name: string
  }
}

// Summary of the account information fetched from the api for "account:current" purposes (currently just balances)
export type AccountSummary = {
  balances: DeriveBalancesAll
}

// This function allows us to easily transform the tuple into the object
// and simplifies the creation of consitent Object and Tuple types (seen below).
export function createCouncilInfoObj(
  activeCouncil: Seat[],
  termEndsAt: BlockNumber,
  autoStart: boolean,
  newTermDuration: BN,
  candidacyLimit: BN,
  councilSize: BN,
  minCouncilStake: Balance,
  minVotingStake: Balance,
  announcingPeriod: BlockNumber,
  votingPeriod: BlockNumber,
  revealingPeriod: BlockNumber,
  round: BN,
  stage: Option<ElectionStage>
) {
  return {
    activeCouncil,
    termEndsAt,
    autoStart,
    newTermDuration,
    candidacyLimit,
    councilSize,
    minCouncilStake,
    minVotingStake,
    announcingPeriod,
    votingPeriod,
    revealingPeriod,
    round,
    stage,
  }
}
// Object/Tuple containing council/councilElection information (council:info).
// The tuple is useful, because that's how api.queryMulti returns the results.
export type CouncilInfoTuple = Parameters<typeof createCouncilInfoObj>
export type CouncilInfoObj = ReturnType<typeof createCouncilInfoObj>

// Object with "name" and "value" properties, used for rendering simple CLI tables like:
// Total balance:   100 JOY
// Free calance:     50 JOY
export type NameValueObj = { name: string; value: string }

// Working groups related types
export enum WorkingGroups {
  StorageProviders = 'storageProviders',
  Curators = 'curators',
}

// In contrast to Pioneer, currently only StorageProviders group is available in CLI
export const AvailableGroups: readonly WorkingGroups[] = [WorkingGroups.StorageProviders] as const

export type Reward = {
  totalRecieved: Balance
  value: Balance
  interval?: number
  nextPaymentBlock: number // 0 = no incoming payment
}

// Compound working group types
export type GroupMember = {
  workerId: WorkerId
  memberId: MemberId
  roleAccount: AccountId
  profile: Membership
  stake?: Balance
  reward?: Reward
}

export type GroupApplication = {
  wgApplicationId: number
  applicationId: number
  wgOpeningId: number
  member: Membership | null
  roleAccout: AccountId
  stakes: {
    application: number
    role: number
  }
  humanReadableText: string
  stage: ApplicationStageKeys
}

export enum OpeningStatus {
  WaitingToBegin = 'WaitingToBegin',
  AcceptingApplications = 'AcceptingApplications',
  InReview = 'InReview',
  Complete = 'Complete',
  Cancelled = 'Cancelled',
  Unknown = 'Unknown',
}

export type GroupOpeningStage = {
  status: OpeningStatus
  block?: number
  date?: Date
}

export type GroupOpeningStakes = {
  application?: StakingPolicy
  role?: StakingPolicy
}

export const stakingPolicyUnstakingPeriodKeys = [
  'crowded_out_unstaking_period_length',
  'review_period_expired_unstaking_period_length',
] as const

export type StakingPolicyUnstakingPeriodKey = typeof stakingPolicyUnstakingPeriodKeys[number]

export const openingPolicyUnstakingPeriodsKeys = [
  'fill_opening_failed_applicant_application_stake_unstaking_period',
  'fill_opening_failed_applicant_role_stake_unstaking_period',
  'fill_opening_successful_applicant_application_stake_unstaking_period',
  'terminate_application_stake_unstaking_period',
  'terminate_role_stake_unstaking_period',
  'exit_role_application_stake_unstaking_period',
  'exit_role_stake_unstaking_period',
] as const

export type OpeningPolicyUnstakingPeriodsKey = typeof openingPolicyUnstakingPeriodsKeys[number]
export type UnstakingPeriodsKey =
  | OpeningPolicyUnstakingPeriodsKey
  | 'crowded_out_application_stake_unstaking_period_length'
  | 'crowded_out_role_stake_unstaking_period_length'
  | 'review_period_expired_application_stake_unstaking_period_length'
  | 'review_period_expired_role_stake_unstaking_period_length'

export type UnstakingPeriods = {
  [k in UnstakingPeriodsKey]: number
}

export type GroupOpening = {
  wgOpeningId: number
  openingId: number
  stage: GroupOpeningStage
  opening: Opening
  stakes: GroupOpeningStakes
  applications: GroupApplication[]
  type: OpeningType
  unstakingPeriods: UnstakingPeriods
}

// Some helper structs for generating human_readable_text in working group opening extrinsic
// Note those types are not part of the runtime etc., we just use them to simplify prompting for values
// (since there exists functionality that handles that for substrate types like: Struct, Vec etc.)
interface WithJSONable<T> {
  toJSONObj: () => T
}
export class HRTJobSpecificsStruct
  extends JoyStructCustom({
    title: Text,
    description: Text,
  })
  implements WithJSONable<JobSpecifics> {
  get title(): string {
    return this.getField('title').toString()
  }

  get description(): string {
    return this.getField('description').toString()
  }

  toJSONObj(): JobSpecifics {
    const { title, description } = this
    return { title, description }
  }
}
export class HRTEntryInMembershipModukeStruct
  extends JoyStructCustom({
    handle: Text,
  })
  implements WithJSONable<EntryInMembershipModuke> {
  get handle(): string {
    return this.getField('handle').toString()
  }

  toJSONObj(): EntryInMembershipModuke {
    const { handle } = this
    return { handle }
  }
}
export class HRTCreatorDetailsStruct
  extends JoyStructCustom({
    membership: HRTEntryInMembershipModukeStruct,
  })
  implements WithJSONable<CreatorDetails> {
  get membership(): EntryInMembershipModuke {
    return this.getField('membership').toJSONObj()
  }

  toJSONObj(): CreatorDetails {
    const { membership } = this
    return { membership }
  }
}
export class HRTHiringProcessStruct
  extends JoyStructCustom({
    details: Vec.with(Text),
  })
  implements WithJSONable<HiringProcess> {
  get details(): AdditionalRolehiringProcessDetails {
    return this.getField('details')
      .toArray()
      .map((v) => v.toString())
  }

  toJSONObj(): HiringProcess {
    const { details } = this
    return { details }
  }
}
export class HRTQuestionFieldStruct
  extends JoyStructCustom({
    title: Text,
    type: Text,
  })
  implements WithJSONable<QuestionField> {
  get title(): string {
    return this.getField('title').toString()
  }

  get type(): string {
    return this.getField('type').toString()
  }

  toJSONObj(): QuestionField {
    const { title, type } = this
    return { title, type }
  }
}
class HRTQuestionsFieldsVec extends Vec.with(HRTQuestionFieldStruct) implements WithJSONable<QuestionsFields> {
  toJSONObj(): QuestionsFields {
    return this.toArray().map((v) => v.toJSONObj())
  }
}
export class HRTQuestionSectionStruct
  extends JoyStructCustom({
    title: Text,
    questions: HRTQuestionsFieldsVec,
  })
  implements WithJSONable<QuestionSection> {
  get title(): string {
    return this.getField('title').toString()
  }

  get questions(): QuestionsFields {
    return this.getField('questions').toJSONObj()
  }

  toJSONObj(): QuestionSection {
    const { title, questions } = this
    return { title, questions }
  }
}
export class HRTQuestionSectionsVec extends Vec.with(HRTQuestionSectionStruct)
  implements WithJSONable<QuestionSections> {
  toJSONObj(): QuestionSections {
    return this.toArray().map((v) => v.toJSONObj())
  }
}
export class HRTApplicationDetailsStruct
  extends JoyStructCustom({
    sections: HRTQuestionSectionsVec,
  })
  implements WithJSONable<ApplicationDetails> {
  get sections(): QuestionSections {
    return this.getField('sections').toJSONObj()
  }

  toJSONObj(): ApplicationDetails {
    const { sections } = this
    return { sections }
  }
}
export class HRTStruct
  extends JoyStructCustom({
    version: u32,
    headline: Text,
    job: HRTJobSpecificsStruct,
    application: HRTApplicationDetailsStruct,
    reward: Text,
    creator: HRTCreatorDetailsStruct,
    process: HRTHiringProcessStruct,
  })
  implements WithJSONable<GenericJoyStreamRoleSchema> {
  get version(): number {
    return this.getField('version').toNumber()
  }

  get headline(): string {
    return this.getField('headline').toString()
  }

  get job(): JobSpecifics {
    return this.getField('job').toJSONObj()
  }

  get application(): ApplicationDetails {
    return this.getField('application').toJSONObj()
  }

  get reward(): string {
    return this.getField('reward').toString()
  }

  get creator(): CreatorDetails {
    return this.getField('creator').toJSONObj()
  }

  get process(): HiringProcess {
    return this.getField('process').toJSONObj()
  }

  toJSONObj(): GenericJoyStreamRoleSchema {
    const { version, headline, job, application, reward, creator, process } = this
    return { version, headline, job, application, reward, creator, process }
  }
}

// Api-related

// Additional options that can be passed to ApiCommandBase.promptForParam in order to override
// its default behaviour, change param name, add validation etc.
export type ApiParamOptions<ParamType = Codec> = {
  forcedName?: string
  value?: {
    default: ParamType
    locked?: boolean
  }
  jsonSchema?: {
    struct: Constructor<Struct>
    schemaValidator: ajv.ValidateFunction
  }
  validator?: Validator
  nestedOptions?: ApiParamsOptions // For more complex params, like structs
}
export type ApiParamsOptions = {
  [paramName: string]: ApiParamOptions
}

export type ApiMethodArg = Codec
export type ApiMethodNamedArg = {
  name: string
  value: ApiMethodArg
}
export type ApiMethodNamedArgs = ApiMethodNamedArg[]
