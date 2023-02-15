import { BaseQueryNodeFixture, FixtureRunner } from '../../Fixture'
import { AddStakingAccountsHappyCaseFixture, BuyMembershipHappyCaseFixture } from '../membership'
import { assertCouncilMembersRuntimeQnMatch } from './common'
import { blake2AsHex } from '@polkadot/util-crypto'
import { GenericAccountId, u64 } from '@polkadot/types'
import { assert } from 'chai'
import { createType, registry } from '@joystream/types'
import { BlackListVoteFixture, VoteFixture } from '../referendum'
import { AnnounceCandidacyFixture } from './announceCandidacyFixture'
import { Api } from 'src/Api'
import { QueryNodeApi } from 'src/QueryNodeApi'
import BN from 'bn.js'

export class ElectCouncilFixture extends BaseQueryNodeFixture {
  protected async createCandidates(numberOfCandidates: number, electionNumber: number): Promise<string[]> {
    const addresses: string[] = []
    for (let i = 0; i < numberOfCandidates; ++i) {
      addresses.push(this.api.createCustomKeyPair('//Candidate//' + electionNumber + '//' + i).address)
    }
    await Promise.all(addresses.map((a) => this.api.treasuryTransferBalance(a, this.api.existentialDeposit())))
    return addresses
  }

  // needed since the first election test usually starts in the Announcing period
  // meanwhile subsequent elections tests start in the Idle period
  protected async getUpcomingAnnouncingPeriod(): Promise<number> {
    const stageUpdate = await this.api.query.council.stage()
    const stage = stageUpdate.stage
    const announcementPeriodId = await this.api.query.council.announcementPeriodNr()
    if (stage.isIdle) {
      return announcementPeriodId.toNumber() + 1
    } else {
      return announcementPeriodId.toNumber() 
    }
  }

  private _optOutVoters: boolean

  protected async maybeBlackListVoters(votersStakingAccounts: string[]) {
    if (this._optOutVoters) {
      // failing case for opted-out voters
      const optOutVotersFixture = new BlackListVoteFixture(this.api, this.query, votersStakingAccounts)
      await new FixtureRunner(optOutVotersFixture).run()
      return
    }
  }

  protected async runVoteFixture(
    votersStakingAccounts: string[],
    candidatesMemberIds: u64[],
    voteStake: BN
  ): Promise<u64> {
    const cycleId = (await this.api.query.referendum.stage()).asVoting.currentCycleId
    const numberOfCandidates = candidatesMemberIds.length
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
      ),
      false
    )
    if (this._optOutVoters) {
      voteFixture.setErrorName('AccountAlreadyOptedOutOfVoting')
    }
    await new FixtureRunner(voteFixture).run()
    return cycleId
  }

  constructor(api: Api, query: QueryNodeApi, optOutVoters = false) {
    super(api, query)
    this._optOutVoters = optOutVoters
  }

  public async execute(): Promise<void> {
    const { api, query } = this

    // get/create candidates member accounts
    const { councilSize, minNumberOfExtraCandidates } = this.api.consts.council
    const numberOfCandidates = councilSize.add(minNumberOfExtraCandidates).toNumber()
    const announcingPeriod = await this.getUpcomingAnnouncingPeriod()
    const candidatesMemberAccounts = await this.createCandidates(numberOfCandidates, announcingPeriod)
    const numberOfVoters = numberOfCandidates

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
    await api.treasuryTransferBalanceToAccounts(votersStakingAccounts, voteStake) // fund accounts

    // blacklist all voters if flag is set
    await this.maybeBlackListVoters(votersStakingAccounts)

    // run vote fixture with assertions
    const cycleId = await this.runVoteFixture(votersStakingAccounts, candidatesMemberIds, voteStake)
    if (this._optOutVoters) {
      return // return as there won't be any votes to reveal
    }

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
