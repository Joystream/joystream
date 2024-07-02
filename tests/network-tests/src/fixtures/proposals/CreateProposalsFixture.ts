import { Api } from '../../Api'
import { QueryNodeApi } from '../../QueryNodeApi'
import { EventType, ProposalDetailsJsonByType, ProposalType } from '../../types'
import { SubmittableExtrinsic } from '@polkadot/api/types'
import { Utils } from '../../utils'
import { ISubmittableResult } from '@polkadot/types/types/'
import { ProposalCreatedEventFieldsFragment, ProposalFieldsFragment } from '../../graphql/generated/queries'
import { assert } from 'chai'
import { PalletProposalsEngineProposalParameters as ProposalParameters } from '@polkadot/types/lookup'
import { MemberId, ProposalId } from '@joystream/types/primitives'
import { FixtureRunner, StandardizedFixture } from '../../Fixture'
import { AddStakingAccountsHappyCaseFixture } from '../membership'
import { getWorkingGroupModuleName } from '../../consts'
import { assertQueriedOpeningMetadataIsValid } from '../workingGroups/utils'
import { OpeningMetadata } from '@joystream/metadata-protobuf'
import { blake2AsHex } from '@polkadot/util-crypto'
import { EventDetails } from '@joystream/cli/src/Types'

export type ProposalCreationParams<T extends ProposalType = ProposalType> = {
  asMember: MemberId
  title: string
  description: string
  exactExecutionBlock?: number
  type: T
  details: ProposalDetailsJsonByType<T>
}

type ProposalCreatedEventDetails = EventDetails<EventType<'proposalsCodex', 'ProposalCreated'>>

export class CreateProposalsFixture extends StandardizedFixture {
  protected events: ProposalCreatedEventDetails[] = []

  protected proposalsParams: ProposalCreationParams[]
  protected stakingAccounts: string[] = []

  public constructor(api: Api, query: QueryNodeApi, proposalsParams: ProposalCreationParams[]) {
    super(api, query)
    this.proposalsParams = proposalsParams
  }

  public getCreatedProposalsIds(): ProposalId[] {
    if (!this.events.length) {
      throw new Error('Trying to get created opening ids before they were created!')
    }
    return this.events.map((e) => e.event.data[0])
  }

  protected proposalParams(i: number): ProposalParameters {
    const proposalType = this.proposalsParams[i].type
    return this.api.proposalParametersByType(proposalType)
  }

  protected async getSignerAccountOrAccounts(): Promise<string[]> {
    return this.api.getMemberSigners(this.proposalsParams)
  }

  protected async initStakingAccounts(): Promise<void> {
    const { api, query } = this
    const stakingAccounts = (await this.api.createKeyPairs(this.proposalsParams.length)).map(({ key }) => key.address)
    const addStakingAccountsFixture = new AddStakingAccountsHappyCaseFixture(
      api,
      query,
      this.proposalsParams.map(({ asMember }, i) => ({
        asMember,
        account: stakingAccounts[i],
        stakeAmount: this.proposalParams(i).requiredStake.unwrapOr(undefined),
      }))
    )
    await new FixtureRunner(addStakingAccountsFixture).run()

    this.stakingAccounts = stakingAccounts
  }

  public async execute(): Promise<void> {
    await this.initStakingAccounts()
    await super.execute()
  }

  protected async getExtrinsics(): Promise<SubmittableExtrinsic<'promise'>[]> {
    return this.proposalsParams.map(({ asMember, description, title, exactExecutionBlock, details, type }, i) => {
      const proposalDetails = { [type]: details } as { [K in ProposalType]: ProposalDetailsJsonByType<K> }
      return this.api.tx.proposalsCodex.createProposal(
        {
          memberId: asMember,
          description: description,
          title: title,
          exactExecutionBlock: exactExecutionBlock,
          stakingAccountId: this.stakingAccounts[i],
        },
        proposalDetails
      )
    })
  }

  protected async getEventFromResult(result: ISubmittableResult): Promise<ProposalCreatedEventDetails> {
    return this.api.getEventDetails(result, 'proposalsCodex', 'ProposalCreated')
  }

  protected assertProposalDetailsAreValid(
    params: ProposalCreationParams<ProposalType>,
    qProposal: ProposalFieldsFragment
  ): void {
    const proposalDetails = this.api.createType('PalletProposalsCodexProposalDetails', {
      [params.type]: params.details,
    })
    switch (params.type) {
      case 'AmendConstitution': {
        Utils.assert(qProposal.details.__typename === 'AmendConstitutionProposalDetails')
        const details = proposalDetails.asAmendConstitution
        assert.equal(qProposal.details.text, details.toHuman()?.toString())
        break
      }
      case 'CancelWorkingGroupLeadOpening': {
        Utils.assert(qProposal.details.__typename === 'CancelWorkingGroupLeadOpeningProposalDetails')
        const details = proposalDetails.asCancelWorkingGroupLeadOpening
        const [openingId, workingGroup] = details
        const expectedId = `${getWorkingGroupModuleName(workingGroup)}-${openingId.toString()}`
        assert.equal(qProposal.details.opening?.id, expectedId)
        break
      }
      case 'CreateWorkingGroupLeadOpening': {
        Utils.assert(qProposal.details.__typename === 'CreateWorkingGroupLeadOpeningProposalDetails')
        const details = proposalDetails.asCreateWorkingGroupLeadOpening
        assert.equal(qProposal.details.group?.id, getWorkingGroupModuleName(details.group))
        assert.equal(qProposal.details.rewardPerBlock.toString(), details.rewardPerBlock.toString())
        assert.equal(qProposal.details.stakeAmount.toString(), details.stakePolicy.stakeAmount.toString())
        assert.equal(qProposal.details.unstakingPeriod, details.stakePolicy.leavingUnstakingPeriod.toNumber())
        Utils.assert(qProposal.details.metadata)
        assertQueriedOpeningMetadataIsValid(
          qProposal.details.metadata,
          Utils.metadataFromBytes(OpeningMetadata, details.description)
        )
        break
      }
      case 'DecreaseWorkingGroupLeadStake': {
        Utils.assert(qProposal.details.__typename === 'DecreaseWorkingGroupLeadStakeProposalDetails')
        const details = proposalDetails.asDecreaseWorkingGroupLeadStake
        const [workerId, amount, group] = details
        const expectedId = `${getWorkingGroupModuleName(group)}-${workerId.toString()}`
        assert.equal(qProposal.details.amount.toString(), amount.toString())
        assert.equal(qProposal.details.lead?.id, expectedId)
        break
      }
      case 'FillWorkingGroupLeadOpening': {
        Utils.assert(qProposal.details.__typename === 'FillWorkingGroupLeadOpeningProposalDetails')
        const details = proposalDetails.asFillWorkingGroupLeadOpening
        const expectedOpeningId = `${getWorkingGroupModuleName(details.workingGroup)}-${details.openingId.toString()}`
        const expectedApplicationId = `${getWorkingGroupModuleName(
          details.workingGroup
        )}-${details.applicationId.toString()}`
        assert.equal(qProposal.details.opening?.id, expectedOpeningId)
        assert.equal(qProposal.details.application?.id, expectedApplicationId)
        break
      }
      case 'FundingRequest': {
        Utils.assert(qProposal.details.__typename === 'FundingRequestProposalDetails')
        const details = proposalDetails.asFundingRequest
        assert.sameDeepMembers(
          qProposal.details.destinationsList?.destinations.map(({ amount, account }) => ({ amount, account })) || [],
          details.map((d) => ({ amount: d.amount.toString(), account: d.account.toString() }))
        )
        break
      }
      case 'RuntimeUpgrade': {
        Utils.assert(qProposal.details.__typename === 'RuntimeUpgradeProposalDetails')
        const details = proposalDetails.asRuntimeUpgrade
        Utils.assert(qProposal.details.newRuntimeBytecode, 'Missing newRuntimeBytecode relationship')
        assert.equal(qProposal.details.newRuntimeBytecode.id, blake2AsHex(details.toU8a(true)))
        const expectedBytecode = '0x' + Buffer.from(details.toU8a(true)).toString('hex')
        const actualBytecode = qProposal.details.newRuntimeBytecode.bytecode
        if (actualBytecode !== expectedBytecode) {
          const diffStartPos = expectedBytecode.split('').findIndex((c, i) => actualBytecode[i] !== c)
          const diffSubExpected = expectedBytecode.slice(diffStartPos, diffStartPos + 10)
          const diffSubActual = actualBytecode.slice(diffStartPos, diffStartPos + 10)
          throw new Error(
            `Runtime bytecode doesn't match the expected one! Diff starts at pos ${diffStartPos}. ` +
              `Expected: ${diffSubExpected}.., Actual: ${diffSubActual}...`
          )
        }
        break
      }
      case 'SetCouncilBudgetIncrement': {
        Utils.assert(qProposal.details.__typename === 'SetCouncilBudgetIncrementProposalDetails')
        const details = proposalDetails.asSetCouncilBudgetIncrement
        assert.equal(qProposal.details.newAmount.toString(), details.toString())
        break
      }
      case 'SetCouncilorReward': {
        Utils.assert(qProposal.details.__typename === 'SetCouncilorRewardProposalDetails')
        const details = proposalDetails.asSetCouncilorReward
        assert.equal(qProposal.details.newRewardPerBlock.toString(), details.toString())
        break
      }
      case 'SetInitialInvitationBalance': {
        Utils.assert(qProposal.details.__typename === 'SetInitialInvitationBalanceProposalDetails')
        const details = proposalDetails.asSetInitialInvitationBalance
        assert.equal(qProposal.details.newInitialInvitationBalance.toString(), details.toString())
        break
      }
      case 'SetInitialInvitationCount': {
        Utils.assert(qProposal.details.__typename === 'SetInitialInvitationCountProposalDetails')
        const details = proposalDetails.asSetInitialInvitationCount
        assert.equal(qProposal.details.newInitialInvitationsCount, details.toNumber())
        break
      }
      case 'SetMaxValidatorCount': {
        Utils.assert(qProposal.details.__typename === 'SetMaxValidatorCountProposalDetails')
        const details = proposalDetails.asSetMaxValidatorCount
        assert.equal(qProposal.details.newMaxValidatorCount, details.toNumber())
        break
      }
      case 'SetMembershipLeadInvitationQuota': {
        Utils.assert(qProposal.details.__typename === 'SetMembershipLeadInvitationQuotaProposalDetails')
        const details = proposalDetails.asSetMembershipLeadInvitationQuota
        assert.equal(qProposal.details.newLeadInvitationQuota, details.toNumber())
        break
      }
      case 'SetMembershipPrice': {
        Utils.assert(qProposal.details.__typename === 'SetMembershipPriceProposalDetails')
        const details = proposalDetails.asSetMembershipPrice
        assert.equal(qProposal.details.newPrice.toString(), details.toString())
        break
      }
      case 'SetReferralCut': {
        Utils.assert(qProposal.details.__typename === 'SetReferralCutProposalDetails')
        const details = proposalDetails.asSetReferralCut
        assert.equal(qProposal.details.newReferralCut, details.toNumber())
        break
      }
      case 'SetWorkingGroupLeadReward': {
        Utils.assert(qProposal.details.__typename === 'SetWorkingGroupLeadRewardProposalDetails')
        const details = proposalDetails.asSetWorkingGroupLeadReward
        const [workerId, reward, group] = details
        const expectedId = `${getWorkingGroupModuleName(group)}-${workerId.toString()}`
        assert.equal(qProposal.details.newRewardPerBlock.toString(), reward.toString())
        assert.equal(qProposal.details.lead?.id, expectedId)
        break
      }
      case 'Signal': {
        Utils.assert(qProposal.details.__typename === 'SignalProposalDetails')
        const details = proposalDetails.asSignal
        assert.equal(qProposal.details.text, details.toHuman()?.toString())
        break
      }
      case 'SlashWorkingGroupLead': {
        Utils.assert(qProposal.details.__typename === 'SlashWorkingGroupLeadProposalDetails')
        const details = proposalDetails.asSlashWorkingGroupLead
        const [workerId, amount, group] = details
        const expectedId = `${getWorkingGroupModuleName(group)}-${workerId.toString()}`
        assert.equal(qProposal.details.lead?.id, expectedId)
        assert.equal(qProposal.details.amount.toString(), amount.toString())
        break
      }
      case 'TerminateWorkingGroupLead': {
        Utils.assert(qProposal.details.__typename === 'TerminateWorkingGroupLeadProposalDetails')
        const details = proposalDetails.asTerminateWorkingGroupLead
        const expectedId = `${getWorkingGroupModuleName(details.group)}-${details.workerId.toString()}`
        assert.equal(qProposal.details.lead?.id, expectedId)
        assert.equal(qProposal.details.slashingAmount!.toString(), details.slashingAmount.toString())
        break
      }
      case 'UpdateWorkingGroupBudget': {
        Utils.assert(qProposal.details.__typename === 'UpdateWorkingGroupBudgetProposalDetails')
        const details = proposalDetails.asUpdateWorkingGroupBudget
        const [balance, group, balanceKind] = details
        assert.equal(qProposal.details.amount.toString(), (balanceKind.isNegative ? '-' : '') + balance.toString())
        assert.equal(qProposal.details.group?.id, getWorkingGroupModuleName(group))
        break
      }
      case 'VetoProposal': {
        Utils.assert(qProposal.details.__typename === 'VetoProposalDetails')
        const details = proposalDetails.asVetoProposal
        assert.equal(qProposal.details.proposal?.id, details.toString())
        break
      }
      case 'SetPalletFozenStatus': {
        Utils.assert(qProposal.details.__typename === 'UpdatePalletFrozenStatusProposalDetails')
        const details = proposalDetails.asSetPalletFozenStatus
        assert.equal(qProposal.details.frozen, details[0].isTrue)
        assert.equal(qProposal.details.pallet, details[1].toString())
        break
      }
      case 'DecreaseCouncilBudget': {
        Utils.assert(qProposal.details.__typename === 'DecreaseCouncilBudgetProposalDetails')
        const details = proposalDetails.asDecreaseCouncilBudget
        assert.equal(qProposal.details.amount.toString(), details.toString())
        break
      }
      case 'SetEraPayoutDampingFactor': {
        Utils.assert(qProposal.details.__typename === 'SetEraPayoutDampingFactorProposalDetails')
        const details = proposalDetails.asSetEraPayoutDampingFactor
        assert.equal(qProposal.details.dampingFactor.toString(), details.toString())
        break
      }
      case 'UpdateTokenPalletTokenConstraints': {
        Utils.assert(qProposal.details.__typename === 'UpdateTokenPalletTokenConstraintsProposalDetails')
        const details = proposalDetails.asUpdateTokenPalletTokenConstraints
        if (details.minAmmSlope.isSome) {
          assert.equal(qProposal.details.minAmmSlope.toString(), details.minAmmSlope.unwrap().toString())
        }
        if (details.ammBuyTxFees.isSome) {
          assert.isNotNull(qProposal.details.ammBuyTxFees)
          assert.isDefined(qProposal.details.ammBuyTxFees)
          assert.equal(qProposal.details.ammBuyTxFees!.toString(), details.ammBuyTxFees.unwrap().toString())
        }
        if (details.ammSellTxFees.isSome) {
          assert.isNotNull(qProposal.details.ammSellTxFees)
          assert.isDefined(qProposal.details.ammSellTxFees)
          assert.equal(qProposal.details.ammSellTxFees!.toString(), details.ammSellTxFees.unwrap().toString())
        }
        if (details.maxYearlyRate.isSome) {
          assert.isNotNull(qProposal.details.maxYearlyRate)
          assert.isDefined(qProposal.details.maxYearlyRate)
          assert.equal(qProposal.details.maxYearlyRate!.toString(), details.maxYearlyRate.unwrap().toString())
        }
        if (details.minSaleDuration.isSome) {
          assert.isNotNull(qProposal.details.minSaleDuration)
          assert.isDefined(qProposal.details.minSaleDuration)
          assert.equal(qProposal.details.minSaleDuration!.toString(), details.minSaleDuration.unwrap().toString())
        }
        if (details.minRevenueSplitDuration.isSome) {
          assert.isNotNull(qProposal.details.minRevenueSplitDuration)
          assert.isDefined(qProposal.details.minRevenueSplitDuration)
          assert.equal(
            qProposal.details.minRevenueSplitDuration!.toString(),
            details.minRevenueSplitDuration.unwrap().toString()
          )
        }
        if (details.minRevenueSplitTimeToStart.isSome) {
          assert.isNotNull(qProposal.details.minRevenueSplitTimeToStart)
          assert.isDefined(qProposal.details.minRevenueSplitTimeToStart)
          assert.equal(
            qProposal.details.minRevenueSplitTimeToStart!.toString(),
            details.minRevenueSplitTimeToStart.unwrap().toString()
          )
        }
        if (details.salePlatformFee.isSome) {
          assert.isNotNull(qProposal.details.salePlatformFee)
          assert.isDefined(qProposal.details.salePlatformFee)
          assert.equal(qProposal.details.salePlatformFee!.toString(), details.salePlatformFee.unwrap().toString())
        }
        if (details.bloatBond.isSome) {
          assert.isNotNull(qProposal.details.bloatBond)
          assert.isDefined(qProposal.details.bloatBond)
          assert.equal(qProposal.details.bloatBond!.toString(), details.bloatBond.unwrap().toString())
        }
        break
      }
      case 'UpdateArgoBridgeConstraints': {
        Utils.assert(qProposal.details.__typename === 'UpdateArgoBridgeConstraintsProposalDetails')
        const details = proposalDetails.asUpdateArgoBridgeConstraints
        if (details.bridgingFee.isSome) {
          assert.isNotNull(qProposal.details.bridgingFee)
          assert.isDefined(qProposal.details.bridgingFee)
          assert.equal(qProposal.details.bridgingFee!.toString(), details.bridgingFee.unwrap().toString())
        }
        // repeat the same if case with details: operatorAccount, pauserAccounts, thawnDuration, remoteChains
        if (details.operatorAccount.isSome) {
          assert.isNotNull(qProposal.details.operatorAccount)
          assert.isDefined(qProposal.details.operatorAccount)
          assert.equal(qProposal.details.operatorAccount!.toString(), details.operatorAccount.unwrap().toString())
        }
        if (details.pauserAccounts.isSome) {
          assert.isNotNull(qProposal.details.pauserAccounts)
          assert.isDefined(qProposal.details.pauserAccounts)
          assert.sameDeepMembers(
            qProposal.details.pauserAccounts!,
            details.pauserAccounts.unwrap().map((a) => a.toString())
          )
        }
        if (details.thawnDuration.isSome) {
          assert.isNotNull(qProposal.details.thawnDuration)
          assert.isDefined(qProposal.details.thawnDuration)
          assert.equal(qProposal.details.thawnDuration!.toString(), details.thawnDuration.unwrap().toString())
        }
        if (details.remoteChains.isSome) {
          assert.isNotNull(qProposal.details.remoteChains)
          assert.isDefined(qProposal.details.remoteChains)
          assert.sameDeepMembers(
            qProposal.details.remoteChains!.map((a) => a.toString()),
            details.remoteChains.unwrap().map((a) => a.toString())
          )
        }
        break
      }
    }
  }

  protected assertQueriedProposalsAreValid(qProposals: ProposalFieldsFragment[]): void {
    this.events.map((e, i) => {
      const proposalParams = this.proposalsParams[i]
      const qProposal = qProposals.find((p) => p.id === e.event.data[0].toString())
      Utils.assert(qProposal, 'Query node: Proposal not found')
      assert.equal(qProposal.councilApprovals, 0)
      assert.equal(qProposal.creator.id, proposalParams.asMember.toString())
      assert.equal(qProposal.description, proposalParams.description)
      assert.equal(qProposal.title, proposalParams.title)
      assert.equal(qProposal.stakingAccount, this.stakingAccounts[i].toString())
      assert.equal(qProposal.exactExecutionBlock, proposalParams.exactExecutionBlock)
      assert.equal(qProposal.status.__typename, 'ProposalStatusDeciding')
      assert.equal(qProposal.statusSetAtBlock, e.blockNumber)
      assert.equal(new Date(qProposal.statusSetAtTime).getTime(), e.blockTimestamp)
      assert.equal(qProposal.createdInEvent.inBlock, e.blockNumber)
      assert.equal(qProposal.createdInEvent.inExtrinsic, this.extrinsics[i].hash.toString())
      assert.equal(qProposal.isFinalized, false)
      assert.equal(qProposal.discussionThread.mode.__typename, 'ProposalDiscussionThreadModeOpen')
      this.assertProposalDetailsAreValid(proposalParams, qProposal)
    })
  }

  protected assertQueryNodeEventIsValid(qEvent: ProposalCreatedEventFieldsFragment, i: number): void {
    // Inetntionally left blank
  }

  async runQueryNodeChecks(): Promise<void> {
    await super.runQueryNodeChecks()

    // Query the proposals
    await this.query.tryQueryWithTimeout(
      () => this.query.getProposalsByIds(this.events.map((e) => e.event.data[0])),
      (result) => this.assertQueriedProposalsAreValid(result)
    )
  }
}
