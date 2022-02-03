import WorkingGroupsCommandBase from '../../base/WorkingGroupsCommandBase'
import { WorkingGroupOpeningInputParameters } from '../../Types'
import { WorkingGroupOpeningInputSchema } from '../../schemas/WorkingGroups'
import chalk from 'chalk'
import { apiModuleByGroup } from '../../Api'
import { JsonSchemaPrompter } from '../../helpers/JsonSchemaPrompt'
import { IOFlags, getInputJson, ensureOutputFileIsWriteable, saveOutputJsonToFile } from '../../helpers/InputOutput'
import ExitCodes from '../../ExitCodes'
import { flags } from '@oclif/command'
import { AugmentedSubmittables } from '@polkadot/api/types'
import { formatBalance } from '@polkadot/util'
import BN from 'bn.js'
import { CLIError } from '@oclif/errors'
import { IOpeningMetadata, OpeningMetadata } from '@joystream/metadata-protobuf'
import { metadataToBytes } from '../../helpers/serialization'
import { OpeningId } from '@joystream/types/working-group'

const OPENING_STAKE = new BN(2000)

export default class WorkingGroupsCreateOpening extends WorkingGroupsCommandBase {
  static description = 'Create working group opening (requires lead access)'
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
    this.log(`You need to stake ${chalk.bold(formatBalance(OPENING_STAKE))} in order to create a new opening.`)

    const [balances] = await this.getApi().getAccountsBalancesInfo([stakingAccount])
    const missingBalance = OPENING_STAKE.sub(balances.availableBalance)
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

  async run(): Promise<void> {
    // lead-only gate
    const lead = await this.getRequiredLeadContext()

    const {
      flags: { input, output, edit, dryRun, stakeTopUpSource },
    } = this.parse(WorkingGroupsCreateOpening)

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

      await this.promptForStakeTopUp(lead.stakingAccount.toString(), stakeTopUpSource)

      this.jsonPrettyPrint(JSON.stringify(rememberedInput))
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
        const result = await this.sendAndFollowTx(
          await this.getDecodedPair(lead.roleAccount),
          this.getOriginalApi().tx[apiModuleByGroup[this.group]].addOpening(...this.createTxParams(rememberedInput))
        )
        const openingId: OpeningId = this.getEvent(result, apiModuleByGroup[this.group], 'OpeningAdded').data[0]
        this.log(chalk.green(`Opening with id ${chalk.magentaBright(openingId)} successfully created!`))
        this.output(openingId.toString())
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
