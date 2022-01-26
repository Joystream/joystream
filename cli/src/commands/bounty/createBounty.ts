import { getInputJson } from '../../helpers/InputOutput'
import { BountyCreationParameters } from '@joystream/types/bounty'
import ExitCodes from '../../ExitCodes'
import { flags } from '@oclif/command'
import { CreateInterface } from '@joystream/types'
import { BountyInputSchema } from '../../json-schemas/Bounty'
import { BountyInputParameters } from '../../Types'
import { asValidatedMetadata, metadataToBytes } from '../../helpers/serialization'
import BountyCommandBase from '../../base/BountyCommandBase'
import chalk from 'chalk'
import { BountyMetadata } from '@joystream/metadata-protobuf'

export default class CreateBountyCommand extends BountyCommandBase {
  static description = 'Create bounty by member or council.'
  static flags = {
    creatorContext: BountyCommandBase.creatorContextFlag,
    contract: BountyCommandBase.contractTypeFlag,
    funding: BountyCommandBase.fundingTypeFlag,
    input: flags.string({
      char: 'i',
      required: true,
      description: `Path to JSON file to use as input`,
    }),
  }

  async run() {
    let { creatorContext, contract, funding, input } = this.parse(CreateBountyCommand).flags

    // TODO: is there a better way to to get the input wothout the prompt?
    // TODO: maybe defining'enum' json schema? and then passing as input file
    // Context
    if (!creatorContext) {
      creatorContext = await this.promptForCreatorContext()
    }

    // Contract Type
    if (!contract) {
      contract = await this.promptForContractType()
    }

    // Funding Type
    if (!funding) {
      funding = await this.promptForFundingType()
    }

    const [creator, creatorAddress] = await this.getBountyActor(creatorContext)

    const bountyInput = await getInputJson<BountyInputParameters>(input, BountyInputSchema)
    const metadata = asValidatedMetadata(BountyMetadata, bountyInput)

    const oracle = await this.validateAndPrepareOracleInput(bountyInput.oracle)
    const contractType = await this.validateAndPrepareContractTypeInput(contract, bountyInput.contractTypeInput)
    const fundingType = await this.validateAndPrepareFundingTypeInput(funding, bountyInput.fundingType)

    // Do remaining validations on input
    if (bountyInput.cherry < this.getOriginalApi().consts.bounty.minCherryLimit.toNumber()) {
      this.error('Attached cherry is less that minimum cherry limit', { exit: ExitCodes.InvalidInput })
    }
    if (bountyInput.entrantStake < this.getOriginalApi().consts.bounty.minWorkEntrantStake.toNumber()) {
      this.error('Attached entrant stake is less that minimum work entrant stake', { exit: ExitCodes.InvalidInput })
    }
    if (bountyInput.workPeriod !== 0) {
      this.error('Work period cannot be zero', { exit: ExitCodes.InvalidInput })
    }
    if (bountyInput.judgementPeriod !== 0) {
      this.error('Judging period cannot be zero', { exit: ExitCodes.InvalidInput })
    }

    const bountyCreationParameters: CreateInterface<BountyCreationParameters> = {
      oracle,
      contract_type: contractType,
      creator,
      cherry: bountyInput.cherry,
      entrant_stake: bountyInput.entrantStake,
      funding_type: fundingType,
      work_period: bountyInput.workPeriod,
      judging_period: bountyInput.judgementPeriod,
    }

    this.jsonPrettyPrint(JSON.stringify({ metadata }))

    await this.requireConfirmation('Do you confirm the provided input?', true)

    const result = await this.sendAndFollowNamedTx(
      await this.getDecodedPair(creatorAddress),
      'bounty',
      'createBounty',
      [bountyCreationParameters, metadataToBytes(BountyMetadata, metadata)]
    )
    if (result) {
      const event = this.findEvent(result, 'bounty', 'BountyCreated')
      this.log(chalk.green(`Bounty with id ${chalk.cyanBright(event?.data[1].toString())} successfully created!`))
    }
  }
}
