import { RolesCommandBase } from './WorkingGroupsCommandBase'
import { flags } from '@oclif/command'
import { CLIError } from '@oclif/errors'
import ExitCodes from '../ExitCodes'
import { AssuranceContractType, BountyActor, FundingType, BountyId } from '@joystream/types/bounty'
import { FundingTypeLimited, FundingTypePrepetual } from 'src/Types'

const CREATOR_CONTEXTS = ['Member', 'Council'] as const
const CONTRACT_TYPE_CONTEXTS = ['Open', 'Closed'] as const
const FUNDING_TYPE_CONTEXTS = ['Perpetual', 'Limited'] as const

type CreatorContext = typeof CREATOR_CONTEXTS[number]
type ContractTypeContext = typeof CONTRACT_TYPE_CONTEXTS[number]
type FundingTypeContext = typeof FUNDING_TYPE_CONTEXTS[number]

/**
 * Abstract base class for commands related to bounty module.
 */
export default abstract class BountyCommandBase extends RolesCommandBase {
  static creatorContextFlag = flags.enum({
    name: 'creatorContext',
    required: false,
    description: `Actor context to execute the command in (${CREATOR_CONTEXTS.join('/')})`,
    options: [...CREATOR_CONTEXTS],
  })

  static contractTypeFlag = flags.enum({
    name: 'contractType',
    required: false,
    description: `Assurance contract type for bounty is (${CONTRACT_TYPE_CONTEXTS.join('/')})`,
    options: [...CONTRACT_TYPE_CONTEXTS],
  })

  static fundingTypeFlag = flags.enum({
    name: 'fundingType',
    required: false,
    description: `Funding type for bounty is (${FUNDING_TYPE_CONTEXTS.join('/')})`,
    options: [...FUNDING_TYPE_CONTEXTS],
  })

  async promptForCreatorContext(
    message = 'Choose in which context you wish to execute the command'
  ): Promise<CreatorContext> {
    return this.simplePrompt({
      message,
      type: 'list',
      choices: CREATOR_CONTEXTS.map((c) => ({ name: c, value: c })),
    })
  }

  async promptForContractType(
    message = 'Choose contract type to select  who can submit work for the bounty'
  ): Promise<ContractTypeContext> {
    return this.simplePrompt({
      message,
      type: 'list',
      choices: CONTRACT_TYPE_CONTEXTS.map((c) => ({ name: c, value: c })),
    })
  }

  async promptForFundingType(
    message = 'Choose funding type for the bounty based on time limitation preferences'
  ): Promise<FundingTypeContext> {
    return this.simplePrompt({
      message,
      type: 'list',
      choices: FUNDING_TYPE_CONTEXTS.map((c) => ({ name: c, value: c })),
    })
  }

  async validateAndPrepareOracleInput(oracle: number | undefined): Promise<BountyActor> {
    if (!oracle) {
      return this.createType('BountyActor', { Council: null })
    } else {
      // ensure that member id is valid
      await this.getOriginalApi().query.members.membershipById(oracle)

      return this.createType('BountyActor', { Member: oracle })
    }
  }

  // validate funding type input passed as json object key value
  async validateAndPrepareFundingTypeInput(
    fundingType: typeof FUNDING_TYPE_CONTEXTS[number],
    fundingInput: FundingTypePrepetual | FundingTypeLimited
  ): Promise<FundingType> {
    const target = (fundingInput as FundingTypePrepetual).target
    const maxFundingAmount = (fundingInput as FundingTypeLimited).maxFundingAmount
    const minFundingAmount = (fundingInput as FundingTypeLimited).minFundingAmount
    const fundingPeriod = (fundingInput as FundingTypeLimited).fundingPeriod

    if (fundingType === 'Perpetual' && target > 0) {
      return this.createType('FundingType', { Perpetual: { target } })
    } else if (
      maxFundingAmount > 0 &&
      minFundingAmount > 0 &&
      fundingPeriod > 0 &&
      maxFundingAmount > minFundingAmount
    ) {
      return this.createType('FundingType', {
        Limited: {
          max_funding_amount: maxFundingAmount,
          min_funding_amount: minFundingAmount,
          funding_period: fundingPeriod,
        },
      })
    } else {
      throw new CLIError('Invalid funding type', { exit: ExitCodes.InvalidInput })
    }
  }

  // prepare 'AssuranceContractType' based on contract type input i.e. Open | Closed. if contract type
  // is open then contractTypeInput field in json input to createBounty command supposed to be empty array.
  // Otherwise it would contain list of member ids that can submit work.
  async validateAndPrepareContractTypeInput(
    contractType: typeof CONTRACT_TYPE_CONTEXTS[number],
    contractInput: string[]
  ): Promise<AssuranceContractType> {
    if (contractType === 'Open') {
      return this.createType('AssuranceContractType', { Open: null })
    } else {
      if (contractInput.length === 0) {
        throw new Error('Closed contract member list is empty')
      }
      if (contractInput.length > this.getOriginalApi().consts.bounty.closedContractSizeLimit.toNumber()) {
        throw new CLIError(`Judging period cannot be zero`)
      }

      // Checks that each member id id valid
      contractInput.forEach(async (each) => {
        const memberId = await this.createType('MemberId', each)
        await this.getApi().expectedMembershipById(memberId)
      })
      return this.createType('AssuranceContractType', { Closed: contractInput })
    }
  }

  async ensureBountyCanBeCanceled(bountyId: BountyId, creator: BountyActor): Promise<void> {
    const bounty = await this.getApi().bountyById(bountyId)

    // Only check if the creator trying to cancel the bounty
    // is Member, Council can always veto the bounty
    if (creator.isOfType('Member') && bounty.creation_params.creator.asType('Member') !== creator.asType('Member')) {
      throw new CLIError(`Provided bounty actor cannot cancel the bounty!`)
    }

    if (!bounty.milestone.isOfType('Created') || !bounty.milestone.asType('Created').has_contributions) {
      throw new CLIError(`Bounty cannot be cancelled at this stage`)
    }
  }

  async getBountyActor(context: typeof CREATOR_CONTEXTS[number]): Promise<[BountyActor, string]> {
    let bountyActorContext: [BountyActor, string]

    if (context === 'Member') {
      const { id, membership } = await this.getRequiredMemberContext()
      bountyActorContext = [this.createType('BountyActor', { Member: id }), membership.controller_account.toString()]
    } else {
      // TODO: check if the logic to validate Council is correct.
      const council = await this.getCouncilMemberContext()
      bountyActorContext = [this.createType('BountyActor', { Council: null }), council.membership_id.toString()]
    }

    return bountyActorContext
  }
}
