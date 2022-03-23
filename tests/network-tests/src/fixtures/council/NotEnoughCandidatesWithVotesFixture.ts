import { BaseQueryNodeFixture, FixtureRunner } from '../../Fixture'
import { assertCouncilMembersRuntimeQnMatch, prepareFailToElectResources } from './common'
import { blake2AsHex } from '@polkadot/util-crypto'
import { assert } from 'chai'
import { MINIMUM_STAKING_ACCOUNT_BALANCE } from '../../consts'

export class NotEnoughCandidatesWithVotesFixture extends BaseQueryNodeFixture {
  public async execute(): Promise<void> {
    const {
      candidatesMemberIds,
      candidatesStakingAccounts,
      candidatesMemberAccounts,
      councilCandidateStake,
      councilMemberIds,
    } = await prepareFailToElectResources(this.api, this.query)

    const lessVotersNumber = 1
    const numberOfCandidates = candidatesMemberIds.length
    const numberOfVoters = numberOfCandidates - 1

    // create voters
    const voteStake = this.api.consts.referendum.minimumStake
    const votersStakingAccounts = (await this.api.createKeyPairs(numberOfVoters)).map(({ key }) => key.address)
    await this.api.treasuryTransferBalanceToAccounts(
      votersStakingAccounts,
      voteStake.addn(MINIMUM_STAKING_ACCOUNT_BALANCE)
    )

    // announcing stage
    await this.api.untilCouncilStage('Announcing')

    // ensure no voting is in progress
    assert((await this.api.query.referendum.stage()).isOfType('Inactive'))
    const announcementPeriodNrInit = await this.api.query.council.announcementPeriodNr()

    // announce candidacies
    const applyForCouncilTxs = candidatesMemberIds.map((memberId, i) =>
      this.api.tx.council.announceCandidacy(
        memberId,
        candidatesStakingAccounts[i],
        candidatesMemberAccounts[i],
        councilCandidateStake
      )
    )
    await this.api.prepareAccountsForFeeExpenses(candidatesMemberAccounts, applyForCouncilTxs)
    await this.api.sendExtrinsicsAndGetResults(applyForCouncilTxs, candidatesMemberAccounts)

    // voting stage
    await this.api.untilCouncilStage('Voting')

    // vote
    const cycleId = (await this.api.query.referendum.stage()).asType('Voting').current_cycle_id
    const votingTxs = votersStakingAccounts.map((account, i) => {
      const accountId = this.api.createType('AccountId', account)
      const optionId = candidatesMemberIds[i % numberOfCandidates]
      const salt = this.api.createType('Bytes', `salt${i}`)

      const payload = Buffer.concat([accountId.toU8a(), optionId.toU8a(), salt.toU8a(), cycleId.toU8a()])
      const commitment = blake2AsHex(payload)
      return this.api.tx.referendum.vote(commitment, voteStake)
    })
    await this.api.prepareAccountsForFeeExpenses(votersStakingAccounts, votingTxs)
    await this.api.sendExtrinsicsAndGetResults(votingTxs, votersStakingAccounts)

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
  }

  public async runQueryNodeChecks(): Promise<void> {
    await super.runQueryNodeChecks()
    await assertCouncilMembersRuntimeQnMatch(this.api, this.query)
  }
}
