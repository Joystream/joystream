import { flags } from '@oclif/command'
import chalk from 'chalk'
import { OracleJudgmentInputSchema } from 'src/json-schemas/Bounty'
import BountyCommandBase from '../../base/BountyCommandBase'
import ExitCodes from '../../ExitCodes'
import { getInputJson } from '../../helpers/InputOutput'
import { OracleJudgmentInputParameters } from '../../Types'

export default class SubmitOracleJudgmentCommand extends BountyCommandBase {
  static description = 'Submit judgment for a bounty.'
  static args = [
    {
      name: 'bountyId',
      required: true,
      description: 'ID of bounty for which judgement is being submitted.',
    },
  ]

  static flags = {
    oracleContext: BountyCommandBase.bountyActorContextFlag,
    input: flags.string({
      char: 'i',
      required: true,
      description: `Path to oracle judgment JSON file to use as input`,
    }),
  }

  async run() {
    let { oracleContext, input } = this.parse(SubmitOracleJudgmentCommand).flags
    const { bountyId } = this.parse(SubmitOracleJudgmentCommand).args

    // Context
    if (!oracleContext) {
      oracleContext = await this.promptForCreatorContext()
    }

    const [oracle, oracleAddress] = await this.getBountyActor(oracleContext)
    const bounty = await this.getApi().bountyById(bountyId)
    const judgmentInput = await getInputJson<OracleJudgmentInputParameters>(input, OracleJudgmentInputSchema)
    const oracleJudgment = await this.validateAndPrepareOracleJudgement(bounty, judgmentInput)

    if (bounty.creation_params.oracle !== oracle) {
      this.error('Bounty actor is not allowed to act as oracle', { exit: ExitCodes.AccessDenied })
    }

    if (!(await this.isJudgmentStage(bounty))) {
      this.error('Judgment cannot be submitted in this stage', { exit: ExitCodes.ApiError })
    }

    if (bounty.active_work_entry_count.toNumber() === 0) {
      this.error('No active work entires exist', { exit: ExitCodes.ApiError })
    }

    this.jsonPrettyPrint(JSON.stringify({ oracle, bountyId, oracleJudgment }))

    await this.requireConfirmation('Do you confirm the provided input?', true)

    const result = await this.sendAndFollowNamedTx(
      await this.getDecodedPair(oracleAddress),
      'bounty',
      'submitOracleJudgment',
      [oracle, bountyId, oracleJudgment]
    )
    if (result) {
      const event = this.findEvent(result, 'bounty', 'OracleJudgmentSubmitted')
      this.log(
        chalk.green(
          `Oracle judgment for bounty with id ${chalk.cyanBright(
            event?.data[0].toString()
          )} was successfully submitted!`
        )
      )
    }
  }
}
