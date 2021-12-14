import { BaseQueryNodeFixture, FixtureRunner } from '../../Fixture'
import { assertCouncilMembersRuntimeQnMatch, prepareFailToElectResources } from './common'
import { assert } from 'chai'

export class NotEnoughCandidatesFixture extends BaseQueryNodeFixture {
  /*
      Execute scenario when not enough candidates announce their candidacy and candidacy announcement stage
      has to be repeated.
  */
  public async execute(): Promise<void> {
    const {
      candidatesMemberIds,
      candidatesStakingAccounts,
      candidatesMemberAccounts,
      councilCandidateStake,
      councilMemberIds,
    } = await prepareFailToElectResources(this.api, this.query)

    const lessCandidatesNumber = 1
    const candidatingMemberIds = candidatesMemberIds.slice(0, candidatesMemberIds.length - lessCandidatesNumber)

    // announcing stage
    await this.api.untilCouncilStage('Announcing')

    // ensure no voting is in progress
    assert((await this.api.query.referendum.stage()).isOfType('Inactive'))
    const announcementPeriodNrInit = await this.api.query.council.announcementPeriodNr()

    // announce candidacies
    const applyForCouncilTxs = candidatingMemberIds.map((memberId, i) =>
      this.api.tx.council.announceCandidacy(
        memberId,
        candidatesStakingAccounts[i],
        candidatesMemberAccounts[i],
        councilCandidateStake
      )
    )
    await this.api.prepareAccountsForFeeExpenses(candidatesMemberAccounts, applyForCouncilTxs)
    await this.api.sendExtrinsicsAndGetResults(applyForCouncilTxs, candidatesMemberAccounts)

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
}
