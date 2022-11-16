import { generateCommitmentFromPayloadFile } from '@joystream/js/content'
import { flags } from '@oclif/command'
import chalk from 'chalk'
import UploadCommandBase from '../../base/UploadCommandBase'
import fs from 'fs'
import { createType } from '@joystream/types'

export default class UpdateChannelPayoutsProposal extends UploadCommandBase {
  static description = 'Create channel payouts proposal.'
  static flags = {
    title: flags.string({
      char: 't',
      required: true,
      description: 'Title of the proposal',
    }),
    description: flags.string({
      char: 'd',
      required: true,
      description: 'Description of the proposal',
    }),
    exactExecutionBlock: flags.integer({
      char: 'b',
      required: false,
      description: 'The Block at which the proposal should be automatically executed',
    }),
    stakingAccountId: flags.string({
      char: 's',
      required: true,
      description: 'Proposer staking account Id',
    }),
    min: flags.integer({
      required: false,
      description: 'Minimum cashout amount allowad to a channel',
    }),
    max: flags.integer({
      required: false,
      description: 'Maximum cashout amount allowed to a channel',
    }),
    channelCashoutsEnabled: flags.boolean({
      char: 'e',
      required: false,
      description: 'Whether cashouts be enabled/disabled',
    }),
    payloadFilePath: flags.string({
      char: 'p',
      required: false,
      description: 'Path to protobuf serialized file containing channel payouts payload',
    }),
    ...UploadCommandBase.flags,
  }

  async run(): Promise<void> {
    const {
      title,
      description,
      exactExecutionBlock,
      stakingAccountId,
      min,
      max,
      channelCashoutsEnabled,
      payloadFilePath,
    } = this.parse(UpdateChannelPayoutsProposal).flags

    // Context
    const member = await this.getRequiredMemberContext()
    const keypair = await this.getDecodedPair(member.membership.controllerAccount)

    const expectedDataSizeFee = await this.getApi().dataObjectPerMegabyteFee()
    const expectedDataObjectStateBloatBond = await this.getApi().dataObjectStateBloatBond()
    const minCashoutAllowed = min || (await this.getOriginalApi().query.content.minCashoutAllowed())
    const maxCashoutAllowed = max || (await this.getOriginalApi().query.content.maxCashoutAllowed())

    this.jsonPrettyPrint(
      JSON.stringify({
        title,
        description,
        exactExecutionBlock,
        stakingAccountId,
        minCashoutAllowed,
        maxCashoutAllowed,
        channelCashoutsEnabled,
      })
    )

    await this.requireConfirmation('Do you confirm the provided input?', true)

    const result = await this.sendAndFollowNamedTx(keypair, 'proposalsCodex', 'createProposal', [
      {
        memberId: member.id,
        title,
        description,
        exactExecutionBlock,
        stakingAccountId,
      },
      {
        UpdateChannelPayouts: createType('PalletContentUpdateChannelPayoutsParametersRecord', {
          commitment: payloadFilePath ? await generateCommitmentFromPayloadFile('PATH', payloadFilePath) : null,
          payload: payloadFilePath
            ? {
                uploaderAccount: keypair.address,
                objectCreationParams: {
                  size_: fs.statSync(payloadFilePath).size,
                  ipfsContentId: await this.calculateFileHash(payloadFilePath),
                },
                expectedDataSizeFee,
                expectedDataObjectStateBloatBond,
              }
            : null,
          minCashoutAllowed,
          maxCashoutAllowed,
          channelCashoutsEnabled: channelCashoutsEnabled ?? true,
        }),
      },
    ])

    const proposalCreatedEvent = this.findEvent(result, 'proposalsCodex', 'ProposalCreated')
    if (proposalCreatedEvent) {
      const [proposalId] = proposalCreatedEvent.data
      this.log(chalk.green(`Channel Payouts proposal with ID ${chalk.cyanBright(proposalId.toString())} created!`))
    }
  }
}
