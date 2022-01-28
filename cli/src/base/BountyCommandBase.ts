import {
  AssuranceContractType,
  BountyActor,
  BountyId,
  FundingType,
  JSBounty as Bounty,
  OracleJudgment,
  OracleWorkEntryJudgment,
} from '@joystream/types/bounty'
import { flags } from '@oclif/command'
import { CLIError } from '@oclif/errors'
import ExitCodes from '../ExitCodes'
import { FundingTypeLimited, FundingTypePrepetual, OracleJudgmentInputParameters, Winner } from '../Types'
import { RolesCommandBase } from './WorkingGroupsCommandBase'

const BOUNTY_ACTOR_CONTEXTS = ['Member', 'Council'] as const
const CONTRACT_TYPE_CONTEXTS = ['Open', 'Closed'] as const
const FUNDING_TYPE_CONTEXTS = ['Perpetual', 'Limited'] as const

type BountyActorContext = typeof BOUNTY_ACTOR_CONTEXTS[number]
type ContractTypeContext = typeof CONTRACT_TYPE_CONTEXTS[number]
type FundingTypeContext = typeof FUNDING_TYPE_CONTEXTS[number]

/**
 * Abstract base class for commands related to bounty module.
 */
export default abstract class BountyCommandBase extends RolesCommandBase {
  static bountyActorContextFlag = flags.enum({
    name: 'creatorContext',
    required: false,
    description: `Actor context to execute the command in (${BOUNTY_ACTOR_CONTEXTS.join('/')})`,
    options: [...BOUNTY_ACTOR_CONTEXTS],
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
  ): Promise<BountyActorContext> {
    return this.simplePrompt({
      message,
      type: 'list',
      choices: BOUNTY_ACTOR_CONTEXTS.map((c) => ({ name: c, value: c })),
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
      const oracleId = await this.createType('MemberId', oracle)
      await this.getApi().expectedMembershipById(oracleId)

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
        throw new CLIError('Closed contract member list is empty')
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

  async validateAndPrepareOracleJudgement(
    bounty: Bounty,
    judgementInput: OracleJudgmentInputParameters
  ): Promise<OracleJudgment> {
    const oracleJudgmentMap = {} as OracleJudgment
    let rewardSumFromJudgment = 0

    judgementInput.map(async ({ entryId, judgment }) => {
      // ensure that entry exists
      await this.getApi().entryById(entryId)

      let workEntryJudgment: OracleWorkEntryJudgment
      const workEntryId = this.createType('EntryId', entryId)

      // if oracle judgment is Winner
      if (judgment.hasOwnProperty('reward')) {
        const reward = (judgment as Winner).reward

        if (reward === 0) {
          throw new CLIError(`Judgment reward cannot be zero`)
        }
        // calculate total reward money
        rewardSumFromJudgment += reward

        workEntryJudgment = this.createType(
          'OracleWorkEntryJudgment',
          this.createType('OracleJudgment_Winner', { Winner: { reward } })
        )
      }

      // if oracle judgment is Rejected
      workEntryJudgment = this.createType('OracleWorkEntryJudgment', { Rejected: null })
      // insert entry id, work entry judgment pair to oracleJudgmentMap
      oracleJudgmentMap.set(workEntryId, workEntryJudgment)
    })

    if (rewardSumFromJudgment !== bounty.total_funding.toNumber()) {
      throw new CLIError(`Total reward should be equal to total funding`)
    }
    return oracleJudgmentMap
  }

  // -----------------------------------
  // BOUNTY STAGE CALCULATION FUNCTIONS
  // -----------------------------------

  async isFundingStage(bounty: Bounty): Promise<boolean> {
    const fundingPeriodIsNotExpired = !(await this.fundingPeriodExpired(bounty))
    return fundingPeriodIsNotExpired
  }

  async isFundingExpiredStage(bounty: Bounty): Promise<boolean> {
    if (bounty.milestone.isOfType('Created')) {
      const hasNoContributions = bounty.milestone.asType('Created').has_contributions.isFalse
      const fundingPeriodIsExpired = await this.fundingPeriodExpired(bounty)
      return fundingPeriodIsExpired && hasNoContributions
    }
    return false
  }

  async isWorkSubmissionStage(bounty: Bounty): Promise<boolean> {
    // Funding period is over. Minimum funding reached. Work period is not expired.
    if (bounty.milestone.isOfType('Created')) {
      // Never expires
      if (bounty.creation_params.funding_type.isOfType('Perpetual')) {
        return false
      }
      const createdAt = bounty.milestone.asType('Created').created_at.toNumber()
      const fundingPeriod = bounty.creation_params.funding_type.asType('Limited').funding_period.toNumber()
      if (
        this.minimumFundingReached(bounty) &&
        (await this.fundingPeriodExpired(bounty)) &&
        !(await this.workPeriodExpired(bounty, createdAt + fundingPeriod))
      ) {
        return true
      }
    }

    // Maximum funding reached. Work period is not expired.
    if (bounty.milestone.isOfType('BountyMaxFundingReached')) {
      const maxFundingReachedAt = bounty.milestone.asType('BountyMaxFundingReached').max_funding_reached_at.toNumber()
      const workPeriodIsNotExpired = !(await this.workPeriodExpired(bounty, maxFundingReachedAt))
      return workPeriodIsNotExpired
    }

    // Work in progress. Work period is not expired.
    if (bounty.milestone.isOfType('WorkSubmitted')) {
      const workPeriodStartedAt = bounty.milestone.asType('WorkSubmitted').work_period_started_at.toNumber()
      const workPeriodIsNotExpired = !(await this.workPeriodExpired(bounty, workPeriodStartedAt))
      return workPeriodIsNotExpired
    }
    return false
  }

  async isJudgmentStage(bounty: Bounty): Promise<boolean> {
    if (bounty.milestone.isOfType('WorkSubmitted')) {
      const workPeriodStartedAt = bounty.milestone.asType('WorkSubmitted').work_period_started_at.toNumber()
      const workPeriodExpired = await this.workPeriodExpired(bounty, workPeriodStartedAt)
      const judgmentPeriodIsNotExpired = !(await this.judgmentPeriodExpired(bounty, workPeriodStartedAt))

      return workPeriodExpired && judgmentPeriodIsNotExpired
    }
    return false
  }

  async isSuccessfulBountyWithdrawalStage(bounty: Bounty): Promise<boolean> {
    if (bounty.milestone.isOfType('JudgmentSubmitted')) {
      const successfulBounty = bounty.milestone.asType('JudgmentSubmitted').successful_bounty
      return successfulBounty.isTrue
    }
    return false
  }

  // ---------------------------------
  // BOUNTY STAGE CALCULATION HELPERS
  // ---------------------------------

  // Checks whether the minimum funding reached for the bounty.
  protected minimumFundingReached(bounty: Bounty): boolean {
    if (bounty.creation_params.funding_type.isOfType('Perpetual')) {
      // There is no minimum for the perpetual
      // funding type - only maximum (target)
      return false
    }
    const minFundingAmount = bounty.creation_params.funding_type.asType('Limited').min_funding_amount.toNumber()
    return bounty.total_funding.toNumber() >= minFundingAmount
  }

  async fundingPeriodExpired(bounty: Bounty): Promise<boolean> {
    // Prepetual funding never expires
    if (bounty.creation_params.funding_type.isOfType('Perpetual')) {
      return false
    }
    // Ensure if limited funding has expired
    const createdAt = bounty.milestone.asType('Created').created_at.toNumber()
    const currentBlock = (await this.getOriginalApi().query.system.number()).toNumber()
    const fundingPeriod = bounty.creation_params.funding_type.asType('Limited').funding_period.toNumber()

    return createdAt + fundingPeriod < currentBlock
  }

  // Checks whether the work period expired by now starting from the provided block number.
  async workPeriodExpired(bounty: Bounty, workPeriodStartedAt: number): Promise<boolean> {
    const currentBlock = (await this.getOriginalApi().query.system.number()).toNumber()
    return workPeriodStartedAt + bounty.creation_params.work_period.toNumber() < currentBlock
  }

  // Checks whether the judgment period expired by now when
  // work period start from the provided block number.
  async judgmentPeriodExpired(bounty: Bounty, workPeriodStartedAt: number): Promise<boolean> {
    const currentBlock = (await this.getOriginalApi().query.system.number()).toNumber()
    return (
      workPeriodStartedAt +
        bounty.creation_params.work_period.toNumber() +
        bounty.creation_params.judging_period.toNumber() <
      currentBlock
    )
  }

  // ----------------------------------------------------------------

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

  async getBountyActor(context: typeof BOUNTY_ACTOR_CONTEXTS[number]): Promise<[BountyActor, string]> {
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
