import { BaseQueryNodeFixture, FixtureRunner } from '../../Fixture'
import { AddStakingAccountsHappyCaseFixture, BuyMembershipHappyCaseFixture } from '../membership'
import { blake2AsHex } from '@polkadot/util-crypto'
import { MINIMUM_STAKING_ACCOUNT_BALANCE } from '../../consts'
import { ForumThreadWithInitialPostFragment, ThreadCreatedEventFieldsFragment } from '../../graphql/generated/queries'
import { assertCouncilMembersRuntimeQnMatch } from './common'
import { Balance } from '@polkadot/types/interfaces'
import { MemberId } from '@joystream/types/common'
import { assert } from 'chai'

interface IScenarioResources {
  candidatesMemberIds: MemberId[]
  candidatesStakingAccounts: string[]
  candidatesMemberAccounts: string[]
  councilCandidateStake: Balance
  councilMemberIds: MemberId[]
}

export class FailToElectCouncilFixture extends BaseQueryNodeFixture {
  /*
    Execute all scenarios when a new council election is expected to fail.
  */
  public async execute(): Promise<void> {
    const { api, query } = this

    const resources1 = await this.prepareScenarioResources()
    await this.executeNotEnoughCandidates(resources1)

    const resources2 = await this.prepareScenarioResources()
    await this.executeNotEnoughCandidatesWithVotes(resources2)
  }

  /*
    Prepares resources used by fail-to-elect council scenarios.
  */
  private async prepareScenarioResources(): Promise<IScenarioResources> {
    const { api, query } = this

    const { councilSize, minNumberOfExtraCandidates } = api.consts.council
    const numberOfCandidates = councilSize.add(minNumberOfExtraCandidates).toNumber()

    // prepare memberships
    const candidatesMemberAccounts = (await this.api.createKeyPairs(numberOfCandidates)).map((kp) => kp.address)
    const buyMembershipsFixture = new BuyMembershipHappyCaseFixture(api, query, candidatesMemberAccounts)
    await new FixtureRunner(buyMembershipsFixture).run()
    const candidatesMemberIds = buyMembershipsFixture.getCreatedMembers()

    // prepare staking accounts
    const councilCandidateStake = api.consts.council.minCandidateStake

    const candidatesStakingAccounts = (await this.api.createKeyPairs(numberOfCandidates)).map((kp) => kp.address)
    const addStakingAccountsFixture = new AddStakingAccountsHappyCaseFixture(
      api,
      query,
      candidatesStakingAccounts.map((account, i) => ({
        asMember: candidatesMemberIds[i],
        account,
        stakeAmount: councilCandidateStake,
      }))
    )
    await new FixtureRunner(addStakingAccountsFixture).run()

    // retrieve currently elected council's members
    const councilMembers = await this.api.query.council.councilMembers()
    const councilMemberIds = councilMembers.map((item) => item.membership_id)

    return {
      candidatesMemberIds,
      candidatesStakingAccounts,
      candidatesMemberAccounts,
      councilCandidateStake,
      councilMemberIds,
    }
  }

  /*
    Execute scenario when not enough candidates announce their candidacy and candidacy announcement stage
    has to be repeated.
  */
  private async executeNotEnoughCandidates({
    candidatesMemberIds,
    candidatesStakingAccounts,
    candidatesMemberAccounts,
    councilCandidateStake,
    councilMemberIds,
  }: IScenarioResources) {
    const { api, query } = this

    const lessCandidatesNumber = 1
    const candidatingMemberIds = candidatesMemberIds.slice(0, candidatesMemberIds.length - lessCandidatesNumber)

    // announcing stage
    await this.api.untilCouncilStage('Announcing')

    // ensure no voting is in progress
    assert((await this.api.query.referendum.stage()).isOfType('Inactive'))
    const announcementPeriodNrInit = await this.api.query.council.announcementPeriodNr()

    // announce candidacies
    const applyForCouncilTxs = candidatingMemberIds.map((memberId, i) =>
      api.tx.council.announceCandidacy(
        memberId,
        candidatesStakingAccounts[i],
        candidatesMemberAccounts[i],
        councilCandidateStake
      )
    )
    await api.prepareAccountsForFeeExpenses(candidatesMemberAccounts, applyForCouncilTxs)
    await api.sendExtrinsicsAndGetResults(applyForCouncilTxs, candidatesMemberAccounts)

    // wait for next announcement stage that should be right after the previous one
    await this.api.untilCouncilStage('Announcing', announcementPeriodNrInit.toNumber() + 1)
    const announcementPeriodNrEnding = await this.api.query.council.announcementPeriodNr()

    assert((await this.api.query.referendum.stage()).isOfType('Inactive'))
    assert.equal(announcementPeriodNrEnding.toNumber(), announcementPeriodNrInit.toNumber() + 1)

    // ensure council members haven't changed
    const councilMembersEnding = await this.api.query.council.councilMembers()
    assert.sameMembers(
      councilMemberIds.map((item) => item.toString()),
      councilMembersEnding.map((item) => item.membership_id.toString())
    )

    await assertCouncilMembersRuntimeQnMatch(this.api, this.query)
  }

  /*
    Execute scenario when enough candidates announce their candidacy but not enough of them receive any votes
    and council can't be fully filled.
  */
  private async executeNotEnoughCandidatesWithVotes({
    candidatesMemberIds,
    candidatesStakingAccounts,
    candidatesMemberAccounts,
    councilCandidateStake,
    councilMemberIds,
  }: IScenarioResources) {
    const { api, query } = this

    const lessVotersNumber = 1
    const numberOfCandidates = candidatesMemberIds.length
    const numberOfVoters = numberOfCandidates - 1

    // create voters
    const voteStake = api.consts.referendum.minimumStake
    const votersStakingAccounts = (await this.api.createKeyPairs(numberOfVoters)).map((kp) => kp.address)
    await api.treasuryTransferBalanceToAccounts(votersStakingAccounts, voteStake.addn(MINIMUM_STAKING_ACCOUNT_BALANCE))

    // announcing stage
    await this.api.untilCouncilStage('Announcing')

    // ensure no voting is in progress
    assert((await this.api.query.referendum.stage()).isOfType('Inactive'))
    const announcementPeriodNrInit = await this.api.query.council.announcementPeriodNr()

    // announce candidacies
    const applyForCouncilTxs = candidatesMemberIds.map((memberId, i) =>
      api.tx.council.announceCandidacy(
        memberId,
        candidatesStakingAccounts[i],
        candidatesMemberAccounts[i],
        councilCandidateStake
      )
    )
    await api.prepareAccountsForFeeExpenses(candidatesMemberAccounts, applyForCouncilTxs)
    await api.sendExtrinsicsAndGetResults(applyForCouncilTxs, candidatesMemberAccounts)

    // voting stage
    await this.api.untilCouncilStage('Voting')

    // vote
    const cycleId = (await this.api.query.referendum.stage()).asType('Voting').current_cycle_id
    const votingTxs = votersStakingAccounts.map((account, i) => {
      const accountId = api.createType('AccountId', account)
      const optionId = candidatesMemberIds[i % numberOfCandidates]
      const salt = api.createType('Bytes', `salt${i}`)

      const payload = Buffer.concat([accountId.toU8a(), optionId.toU8a(), salt.toU8a(), cycleId.toU8a()])
      const commitment = blake2AsHex(payload)
      return api.tx.referendum.vote(commitment, voteStake)
    })
    await api.prepareAccountsForFeeExpenses(votersStakingAccounts, votingTxs)
    await api.sendExtrinsicsAndGetResults(votingTxs, votersStakingAccounts)

    // Announcing stage
    await this.api.untilCouncilStage('Announcing')
    const announcementPeriodNrEnding = await this.api.query.council.announcementPeriodNr()

    // ensure new announcement stage started
    assert((await this.api.query.referendum.stage()).isOfType('Inactive'))
    assert.equal(announcementPeriodNrEnding.toNumber(), announcementPeriodNrInit.toNumber() + 1)

    // ensure council members haven't changed
    const councilMembersEnding = await this.api.query.council.councilMembers()
    assert.sameMembers(
      councilMemberIds.map((item) => item.toString()),
      councilMembersEnding.map((item) => item.membership_id.toString())
    )

    await assertCouncilMembersRuntimeQnMatch(this.api, this.query)
  }

  async aaa({ councilMemberIds }: IScenarioResources) {
    // ensure council members haven't changed
    const councilMembersEnding = await this.api.query.council.councilMembers()
    assert.sameMembers(
      councilMemberIds.map((item) => item.toString()),
      councilMembersEnding.map((item) => item.membership_id.toString())
    )

    await assertCouncilMembersRuntimeQnMatch(this.api, this.query)
  }
}
