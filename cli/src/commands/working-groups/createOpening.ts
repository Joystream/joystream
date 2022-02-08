import WorkingGroupsCommandBase from '../../base/WorkingGroupsCommandBase'
import { GroupMember, WorkingGroupOpeningInputParameters } from '../../Types'
import { WorkingGroupOpeningInputSchema } from '../../schemas/WorkingGroups'
import chalk from 'chalk'
import { apiModuleByGroup } from '../../Api'
import { JsonSchemaPrompter } from '../../helpers/JsonSchemaPrompt'
import { IOFlags, getInputJson, ensureOutputFileIsWriteable, saveOutputJsonToFile } from '../../helpers/InputOutput'
import ExitCodes from '../../ExitCodes'
import { flags } from '@oclif/command'
import { AugmentedSubmittables } from '@polkadot/api/types'
import { formatBalance } from '@polkadot/util'
import { CLIError } from '@oclif/errors'
import {
  IOpeningMetadata,
  IWorkingGroupMetadataAction,
  OpeningMetadata,
  WorkingGroupMetadataAction,
} from '@joystream/metadata-protobuf'
import { metadataToBytes } from '../../helpers/serialization'
import { OpeningId } from '@joystream/types/working-group'
import Long from 'long'
import moment from 'moment'
import { UpcomingWorkingGroupOpeningDetailsFragment } from '../../graphql/generated/queries'
import { DEFAULT_DATE_FORMAT } from '../../Consts'

export default class WorkingGroupsCreateOpening extends WorkingGroupsCommandBase {
  static description = 'Create working group opening / upcoming opening (requires lead access)'
  static flags = {
    input: IOFlags.input,
    output: flags.string({
      char: 'o',
      required: false,
      description: 'Path to the file where the output JSON should be saved (this output can be then reused as input)',
    }),
    edit: flags.boolean({
      char: 'e',
      required: false,
      description:
        'If provided along with --input - launches in edit mode allowing to modify the input before sending the exstinsic',
      dependsOn: ['input'],
    }),
    dryRun: flags.boolean({
      required: false,
      description:
        'If provided along with --output - skips sending the actual extrinsic' +
        '(can be used to generate a "draft" which can be provided as input later)',
      dependsOn: ['output'],
    }),
    stakeTopUpSource: flags.string({
      required: false,
      description:
        "If provided - this account (key) will be used as default funds source for lead stake top up (in case it's needed)",
    }),
    upcoming: flags.boolean({
      description: 'Whether the opening should be an upcoming opening',
    }),
    startsAt: flags.string({
      required: false,
      description: `If upcoming opening - the expected opening start date (${DEFAULT_DATE_FORMAT})`,
      dependsOn: ['upcoming'],
    }),
    ...WorkingGroupsCommandBase.flags,
  }

  prepareMetadata(openingParamsJson: WorkingGroupOpeningInputParameters): IOpeningMetadata {
    return {
      ...openingParamsJson,
      applicationFormQuestions: openingParamsJson.applicationFormQuestions?.map((q) => ({
        question: q.question,
        type: OpeningMetadata.ApplicationFormQuestion.InputType[q.type],
      })),
    }
  }

  createTxParams(
    openingParamsJson: WorkingGroupOpeningInputParameters
  ): Parameters<AugmentedSubmittables<'promise'>['membershipWorkingGroup']['addOpening']> {
    return [
      metadataToBytes(OpeningMetadata, this.prepareMetadata(openingParamsJson)),
      'Regular',
      {
        stake_amount: openingParamsJson.stakingPolicy.amount,
        leaving_unstaking_period: openingParamsJson.stakingPolicy.unstakingPeriod,
      },
      // TODO: Proper bigint handling?
      openingParamsJson.rewardPerBlock?.toString() || null,
    ]
  }

  async promptForData(
    rememberedInput?: WorkingGroupOpeningInputParameters
  ): Promise<WorkingGroupOpeningInputParameters> {
    const openingDefaults = rememberedInput
    const openingPrompt = new JsonSchemaPrompter<WorkingGroupOpeningInputParameters>(
      WorkingGroupOpeningInputSchema,
      openingDefaults
    )
    const openingParamsJson = await openingPrompt.promptAll()

    return openingParamsJson
  }

  async getInputFromFile(filePath: string): Promise<WorkingGroupOpeningInputParameters> {
    return getInputJson<WorkingGroupOpeningInputParameters>(filePath, WorkingGroupOpeningInputSchema)
  }

  async promptForStakeTopUp(stakingAccount: string, fundsSource?: string): Promise<void> {
    const requiredStake = this.getOriginalApi().consts[apiModuleByGroup[this.group]].leaderOpeningStake
    this.log(`You need to stake ${chalk.bold(formatBalance(requiredStake))} in order to create a new opening.`)

    const [balances] = await this.getApi().getAccountsBalancesInfo([stakingAccount])
    const missingBalance = requiredStake.sub(balances.availableBalance)
    if (missingBalance.gtn(0)) {
      await this.requireConfirmation(
        `Do you wish to transfer remaining ${chalk.bold(
          formatBalance(missingBalance)
        )} to your staking account? (${stakingAccount})`
      )
      if (!fundsSource) {
        fundsSource = await this.promptForAccount('Choose account to transfer the funds from')
      }
      await this.sendAndFollowNamedTx(await this.getDecodedPair(fundsSource), 'balances', 'transferKeepAlive', [
        stakingAccount,
        missingBalance,
      ])
    }
  }

  async createOpening(lead: GroupMember, inputParameters: WorkingGroupOpeningInputParameters): Promise<OpeningId> {
    const result = await this.sendAndFollowTx(
      await this.getDecodedPair(lead.roleAccount),
      this.getOriginalApi().tx[apiModuleByGroup[this.group]].addOpening(...this.createTxParams(inputParameters))
    )
    const openingId: OpeningId = this.getEvent(result, apiModuleByGroup[this.group], 'OpeningAdded').data[0]
    this.log(chalk.green(`Opening with id ${chalk.magentaBright(openingId)} successfully created!`))
    this.output(openingId.toString())
    return openingId
  }

  async createUpcomingOpening(
    lead: GroupMember,
    actionMetadata: IWorkingGroupMetadataAction
  ): Promise<UpcomingWorkingGroupOpeningDetailsFragment | undefined> {
    const result = await this.sendAndFollowTx(
      await this.getDecodedPair(lead.roleAccount),
      this.getOriginalApi().tx[apiModuleByGroup[this.group]].setStatusText(
        metadataToBytes(WorkingGroupMetadataAction, actionMetadata)
      )
    )
    const { indexInBlock, blockNumber } = await this.getEventDetails(
      result,
      apiModuleByGroup[this.group],
      'StatusTextChanged'
    )
    if (this.isQueryNodeUriSet()) {
      let createdUpcomingOpening: UpcomingWorkingGroupOpeningDetailsFragment | null = null
      let currentAttempt = 0
      const maxRetryAttempts = 5
      while (!createdUpcomingOpening && currentAttempt <= maxRetryAttempts) {
        ++currentAttempt
        createdUpcomingOpening = await this.getQNApi().upcomingWorkingGroupOpeningByEvent(blockNumber, indexInBlock)
        if (!createdUpcomingOpening && currentAttempt <= maxRetryAttempts) {
          this.log(
            `Waiting for the upcoming opening to be processed by the query node (${currentAttempt}/${maxRetryAttempts})...`
          )
          await new Promise((resolve) => setTimeout(resolve, 6000))
        }
      }
      if (!createdUpcomingOpening) {
        this.error('Could not fetch the upcoming opening from the query node', { exit: ExitCodes.QueryNodeError })
      }
      this.log(
        chalk.green(`Upcoming opening with id ${chalk.magentaBright(createdUpcomingOpening.id)} successfully created!`)
      )
      this.output(createdUpcomingOpening.id)
      return createdUpcomingOpening
    } else {
      this.log(`StatusTextChanged event emitted in block ${blockNumber}, index: ${indexInBlock}`)
      this.warn('Query node uri not set, cannot confirm whether the upcoming opening was succesfully created')
    }
  }

  validateUpcomingOpeningStartDate(dateStr: string): string | true {
    const momentObj = moment(dateStr, DEFAULT_DATE_FORMAT)
    if (!momentObj.isValid()) {
      return `Unrecognized date format: ${dateStr}`
    }
    const ts = momentObj.unix()
    if (ts <= moment().unix()) {
      return 'Upcoming opening start date should be in the future!'
    }
    return true
  }

  async getUpcomingOpeningExpectedStartTimestamp(dateStr: string | undefined): Promise<number> {
    if (dateStr) {
      const validationResult = this.validateUpcomingOpeningStartDate(dateStr)
      if (validationResult === true) {
        return moment(dateStr).unix()
      } else {
        this.warn(`Invalid opening start date provided: ${validationResult}`)
      }
    }
    dateStr = await this.simplePrompt<string>({
      message: `Expected upcoming opening start date (${DEFAULT_DATE_FORMAT}):`,
      validate: (dateStr) => this.validateUpcomingOpeningStartDate(dateStr),
    })
    return moment(dateStr).unix()
  }

  prepareCreateUpcomingOpeningMetadata(
    inputParameters: WorkingGroupOpeningInputParameters,
    expectedStartTs: number
  ): IWorkingGroupMetadataAction {
    return {
      addUpcomingOpening: {
        metadata: {
          rewardPerBlock: inputParameters.rewardPerBlock ? Long.fromNumber(inputParameters.rewardPerBlock) : undefined,
          expectedStart: expectedStartTs,
          minApplicationStake: Long.fromNumber(inputParameters.stakingPolicy.amount),
          metadata: this.prepareMetadata(inputParameters),
        },
      },
    }
  }

  async run(): Promise<void> {
    // lead-only gate
    const lead = await this.getRequiredLeadContext()

    const {
      flags: { input, output, edit, dryRun, stakeTopUpSource, upcoming, startsAt },
    } = this.parse(WorkingGroupsCreateOpening)

    const expectedStartTs = upcoming ? await this.getUpcomingOpeningExpectedStartTimestamp(startsAt) : 0

    ensureOutputFileIsWriteable(output)

    let tryAgain = false
    let rememberedInput: WorkingGroupOpeningInputParameters | undefined
    do {
      if (edit) {
        rememberedInput = await this.getInputFromFile(input as string)
      }
      // Either prompt for the data or get it from input file
      const openingJson =
        !input || edit || tryAgain ? await this.promptForData(rememberedInput) : await this.getInputFromFile(input)

      // Remember the provided/fetched data in a variable
      rememberedInput = openingJson

      if (!upcoming) {
        await this.promptForStakeTopUp(lead.stakingAccount.toString(), stakeTopUpSource)
      }

      const createUpcomingOpeningActionMeta = this.prepareCreateUpcomingOpeningMetadata(
        rememberedInput,
        expectedStartTs
      )

      this.jsonPrettyPrint(
        JSON.stringify(upcoming ? { WorkingGroupMetadataAction: createUpcomingOpeningActionMeta } : rememberedInput)
      )
      const confirmed = await this.requestConfirmation('Do you confirm the provided input?')
      if (!confirmed) {
        tryAgain = await this.requestConfirmation('Try again with remembered input?')
        continue
      }

      // Save output to file
      if (output) {
        try {
          saveOutputJsonToFile(output, rememberedInput)
          this.log(chalk.green(`Output successfully saved in: ${chalk.magentaBright(output)}!`))
        } catch (e) {
          this.warn(`Could not save output to ${output}!`)
        }
      }

      if (dryRun) {
        this.exit(ExitCodes.OK)
      }

      // Send the tx
      try {
        upcoming
          ? await this.createUpcomingOpening(lead, createUpcomingOpeningActionMeta)
          : await this.createOpening(lead, rememberedInput)
        tryAgain = false
      } catch (e) {
        if (e instanceof CLIError) {
          this.warn(e.message)
        }
        tryAgain = await this.requestConfirmation('Try again with remembered input?')
      }
    } while (tryAgain)
  }
}
