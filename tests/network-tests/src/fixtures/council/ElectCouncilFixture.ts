import { BaseQueryNodeFixture, FixtureRunner } from '../../Fixture'
import { AddStakingAccountsHappyCaseFixture, BuyMembershipHappyCaseFixture } from '../membership'
import { assertCouncilMembersRuntimeQnMatch } from './common'
import { blake2AsHex } from '@polkadot/util-crypto'
import { GenericAccountId } from '@polkadot/types'
import { assert } from 'chai'
import { createType, registry } from '@joystream/types'
import { BlackListVoteFixture, VoteFixture } from '../referendum'
import { AnnounceCandidacyFixture } from './announceCandidacyFixture'

export class ElectCouncilFixture extends BaseQueryNodeFixture {
  public async execute(): Promise<void> {
    const { api, query } = this
    const { councilSize, minNumberOfExtraCandidates } = api.consts.council
    const numberOfCandidates = councilSize.add(minNumberOfExtraCandidates).toNumber()
    const numberOfVoters = numberOfCandidates

    // Prepare memberships
    const candidatesMemberAccounts = (await this.api.createKeyPairs(numberOfCandidates)).map(({ key }) => key.address)
    const buyMembershipsFixture = new BuyMembershipHappyCaseFixture(api, query, candidatesMemberAccounts)
    await new FixtureRunner(buyMembershipsFixture).run()
    const candidatesMemberIds = buyMembershipsFixture.getCreatedMembers()

    // Prepare staking accounts
    const councilCandidateStake = api.consts.council.minCandidateStake
    const voteStake = api.consts.referendum.minimumStake

    const candidatesStakingAccounts = (await this.api.createKeyPairs(numberOfCandidates)).map(({ key }) => key.address)
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

    // Announcing stage
    await this.api.untilCouncilStage('Announcing')

    const announceCandidacyFixture = new AnnounceCandidacyFixture(
      this.api,
      this.query,
      new Map(
        candidatesMemberAccounts.map((account, i) => {
          return [
            account,
            {
              memberId: candidatesMemberIds[i],
              stakingAccount: candidatesStakingAccounts[i],
              rewardAccount: account,
              stake: councilCandidateStake,
            },
          ]
        })
      )
    )
    await new FixtureRunner(announceCandidacyFixture).run()

    // Voting stage
    await this.api.untilCouncilStage('Voting')

    const votersStakingAccounts = (await this.api.createKeyPairs(numberOfVoters)).map(({ key }) => key.address)
    const optOutVoters = (await this.api.createKeyPairs(numberOfVoters)).map(({ key }) => key.address)
    await api.treasuryTransferBalanceToAccounts(votersStakingAccounts, voteStake)

    const cycleId = (await this.api.query.referendum.stage()).asVoting.currentCycleId
    const commitments = votersStakingAccounts.map((account, i) => {
      const accountId = new GenericAccountId(registry, account)
      const optionId = candidatesMemberIds[i % numberOfCandidates]
      const salt = createType('Bytes', `salt${i}`)

      const payload = Buffer.concat([accountId.toU8a(), optionId.toU8a(), salt.toU8a(), cycleId.toU8a()])
      const commitment = blake2AsHex(payload)
      return commitment
    })

    const voteFixture = new VoteFixture(
      this.api,
      this.query,
      new Map(
        votersStakingAccounts.map((account, i) => {
          return [
            account,
            {
              commitment: commitments[i],
              stake: voteStake,
            },
          ]
        })
      )
    )
    await new FixtureRunner(voteFixture).run()

    // failing case for opted-out voters
    this.debug(`accounts opting out of voting 👍`)
    const optOutVotersFixture = new BlackListVoteFixture(this.api, this.query, optOutVoters)
    await new FixtureRunner(optOutVotersFixture).run()

    const failingVotesFixture = new VoteFixture(
      this.api,
      this.query,
      new Map(
        optOutVoters.map((account, i) => {
          return [
            account,
            {
              // these parameters won't be considered
              commitment: commitments[i % optOutVoters.length],
              stake: voteStake,
            },
          ]
        })
      ),
      true
    )

    await new FixtureRunner(failingVotesFixture).run()
    failingVotesFixture.assertError('AccountAlreadyOptedOutOfVoting')

    // Revealing stage
    await this.api.untilCouncilStage('Revealing')

    const revealingTxs = votersStakingAccounts.map((account, i) => {
      const optionId = candidatesMemberIds[i % numberOfCandidates]
      return api.tx.referendum.revealVote(`salt${i}`, optionId)
    })
    await api.prepareAccountsForFeeExpenses(votersStakingAccounts, revealingTxs)
    await api.sendExtrinsicsAndGetResults(revealingTxs, votersStakingAccounts)

    const candidatesToWinIds = candidatesMemberIds.slice(0, councilSize.toNumber()).map((id) => id.toString())

    // check intermediate election winners are properly set
    if (this.queryNodeChecksEnabled) {
      await query.tryQueryWithTimeout(
        () => query.getReferendumIntermediateWinners(cycleId.toNumber(), councilSize.toNumber()),
        (qnReferendumIntermediateWinners) => {
          assert.sameMembers(
            qnReferendumIntermediateWinners.map((item) => item.member.id.toString()),
            candidatesToWinIds
          )
        }
      )
    }

    await this.api.untilCouncilStage('Idle')

    const councilMembers = await api.query.council.councilMembers()
    assert.sameMembers(
      councilMembers.map((m) => m.membershipId.toString()),
      candidatesToWinIds
    )
  }

  public async runQueryNodeChecks(): Promise<void> {
    await super.runQueryNodeChecks()
    await assertCouncilMembersRuntimeQnMatch(this.api, this.query)
  }
}
