import { Api } from '../Api'
import BN from 'bn.js'
import { assert } from 'chai'
import { Seat } from '@joystream/types/council'
import { v4 as uuid } from 'uuid'
import { Utils } from '../utils'
import { BaseFixture } from '../Fixture'

export class ElectCouncilFixture extends BaseFixture {
  private voters: string[]
  private applicants: string[]
  private k: number
  private greaterStake: BN
  private lesserStake: BN

  public constructor(api: Api, voters: string[], applicants: string[], k: number, greaterStake: BN, lesserStake: BN) {
    super(api)
    this.voters = voters
    this.applicants = applicants
    this.k = k
    this.greaterStake = greaterStake
    this.lesserStake = lesserStake
  }

  public async execute(): Promise<void> {
    // Assert no council exists
    if ((await this.api.getCouncil()).length) {
      return this.error(new Error('Council election fixture expects no council seats to be filled'))
    }

    let now = await this.api.getBestBlock()
    const applyForCouncilFee: BN = this.api.estimateApplyForCouncilFee(this.greaterStake)
    const voteForCouncilFee: BN = this.api.estimateVoteForCouncilFee(
      this.applicants[0],
      this.applicants[0],
      this.greaterStake
    )
    const salt: string[] = this.voters.map(() => {
      return ''.concat(uuid().replace(/-/g, ''))
    })
    const revealVoteFee: BN = this.api.estimateRevealVoteFee(this.applicants[0], salt[0])

    // Topping the balances
    this.api.treasuryTransferBalanceToAccounts(this.applicants, applyForCouncilFee.add(this.greaterStake))
    this.api.treasuryTransferBalanceToAccounts(this.voters, voteForCouncilFee.add(revealVoteFee).add(this.greaterStake))

    // First K members stake more
    await this.api.sudoStartAnnouncingPeriod(now.addn(100))
    await this.api.batchApplyForCouncilElection(this.applicants.slice(0, this.k), this.greaterStake)
    this.applicants.slice(0, this.k).forEach((account) =>
      this.api.getCouncilElectionStake(account).then((stake) => {
        assert(
          stake.eq(this.greaterStake),
          `${account} not applied correctly for council election with stake ${stake} versus expected ${this.greaterStake}`
        )
      })
    )

    // Last members stake less
    await this.api.batchApplyForCouncilElection(this.applicants.slice(this.k), this.lesserStake)
    this.applicants.slice(this.k).forEach((account) =>
      this.api.getCouncilElectionStake(account).then((stake) => {
        assert(
          stake.eq(this.lesserStake),
          `${account} not applied correctrly for council election with stake ${stake} versus expected ${this.lesserStake}`
        )
      })
    )

    // Voting
    await this.api.sudoStartVotingPeriod(now.addn(100))
    await this.api.batchVoteForCouncilMember(
      this.voters.slice(0, this.k),
      this.applicants.slice(0, this.k),
      salt.slice(0, this.k),
      this.lesserStake
    )
    await this.api.batchVoteForCouncilMember(
      this.voters.slice(this.k),
      this.applicants.slice(this.k),
      salt.slice(this.k),
      this.greaterStake
    )

    // Revealing
    await this.api.sudoStartRevealingPeriod(now.addn(100))
    await this.api.batchRevealVote(
      this.voters.slice(0, this.k),
      this.applicants.slice(0, this.k),
      salt.slice(0, this.k)
    )
    await this.api.batchRevealVote(this.voters.slice(this.k), this.applicants.slice(this.k), salt.slice(this.k))
    now = await this.api.getBestBlock()

    // Resolving election
    // 3 is to ensure the revealing block is in future
    await this.api.sudoStartRevealingPeriod(now.addn(3))
    await Utils.wait(this.api.getBlockDuration().muln(2.5).toNumber())
    const seats: Seat[] = await this.api.getCouncil()

    // Assert a council was created
    if (!seats.length) {
      this.error(new Error('Expected council to be elected'))
    }

    // const applicantAddresses: string[] = this.applicantKeyPairs.map((keyPair) => keyPair.address)
    // const voterAddresses: string[] = this.voterKeyPairs.map((keyPair) => keyPair.address)
    // const councilMembers: string[] = seats.map((seat) => seat.member.toString())
    // const backers: string[] = seats.map((seat) => seat.backers.map((backer) => backer.member.toString())).flat()
  }
}
