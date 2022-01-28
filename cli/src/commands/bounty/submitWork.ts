import { BountyWorkData } from '@joystream/metadata-protobuf'
import { flags } from '@oclif/command'
import chalk from 'chalk'
import BountyCommandBase from '../../base/BountyCommandBase'
import ExitCodes from '../../ExitCodes'
import { getInputJson } from '../../helpers/InputOutput'
import { asValidatedMetadata, metadataToBytes } from '../../helpers/serialization'
import { BountyWorkDataInputSchema } from '../../json-schemas/Bounty'
import { BountyWorkDataInputParameters } from '../../Types'

export default class SubmitWorkCommand extends BountyCommandBase {
  static description = 'Submit work for a bounty.'
  static args = [
    {
      name: 'bountyId',
      required: true,
      description: 'ID for the bounty',
    },
    {
      name: 'entryId',
      required: true,
      description: 'ID for work entry.',
    },
  ]

  static flags = {
    input: flags.string({
      char: 'i',
      required: true,
      description: `Path to work data JSON file to use as input`,
    }),
  }

  async run() {
    const { input } = this.parse(SubmitWorkCommand).flags
    const { bountyId, entryId } = this.parse(SubmitWorkCommand).args

    const bounty = await this.getApi().bountyById(bountyId)
    // ensure that entry exists
    await this.getApi().entryById(entryId)
    const memberContext = await this.getRequiredMemberContext()
    const canWorkbeSubmitted = await this.isWorkSubmissionStage(bounty)

    if (!canWorkbeSubmitted) {
      this.error('Work cannot be submitted in this stage', { exit: ExitCodes.ApiError })
    }

    const workDataInput = await getInputJson<BountyWorkDataInputParameters>(input, BountyWorkDataInputSchema)
    const workData = asValidatedMetadata(BountyWorkData, workDataInput)

    this.jsonPrettyPrint(JSON.stringify({ memberId: memberContext.id, bountyId, entryId }))

    await this.requireConfirmation('Do you confirm the the input?', true)

    const result = await this.sendAndFollowNamedTx(
      await this.getDecodedPair(memberContext.membership.controller_account.toString()),
      'bounty',
      'submitWork',
      [memberContext.id, bountyId, entryId, metadataToBytes(BountyWorkData, workData)]
    )
    if (result) {
      const event = this.findEvent(result, 'bounty', 'WorkSubmitted')
      this.log(
        chalk.green(
          `Work data successfully submitted for bounty with id ${chalk.cyanBright(event?.data[0].toString())}`
        )
      )
    }
  }
}
