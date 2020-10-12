import { Api } from '../Api'
import { KeyringPair } from '@polkadot/keyring/types'
import BN from 'bn.js'
import { assert } from 'chai'
import { Seat } from '@joystream/types/council'
import { v4 as uuid } from 'uuid'
import { Utils } from '../utils'
import { Fixture } from '../IFixture'

export class ElectCouncilFixture implements Fixture {
  private api: Api
  private voterKeyPairs: KeyringPair[]
  private applicantKeyPairs: KeyringPair[]
  private k: number
  private sudo: KeyringPair
  private greaterStake: BN
  private lesserStake: BN

  public constructor(
    api: Api,
    voterKeyPairs: KeyringPair[],
    applicantKeyPairs: KeyringPair[],
    k: number,
    sudo: KeyringPair,
    greaterStake: BN,
    lesserStake: BN
  ) {
    this.api = api
    this.voterKeyPairs = voterKeyPairs
    this.applicantKeyPairs = applicantKeyPairs
    this.k = k
    this.sudo = sudo
    this.greaterStake = greaterStake
    this.lesserStake = lesserStake
  }

  public async runner(expectFailure: boolean): Promise<void> {
    // Assert no council exists
    assert((await this.api.getCouncil()).length === 0)

    let now = await this.api.getBestBlock()
    const applyForCouncilFee: BN = this.api.estimateApplyForCouncilFee(this.greaterStake)
    const voteForCouncilFee: BN = this.api.estimateVoteForCouncilFee(
      this.sudo.address,
      this.sudo.address,
      this.greaterStake
    )
    const salt: string[] = []
    this.voterKeyPairs.forEach(() => {
      salt.push(''.concat(uuid().replace(/-/g, '')))
    })
    const revealVoteFee: BN = this.api.estimateRevealVoteFee(this.sudo.address, salt[0])

    // Topping the balances
    this.api.transferBalanceToAccounts(this.sudo, this.applicantKeyPairs, applyForCouncilFee.add(this.greaterStake))
    this.api.transferBalanceToAccounts(
      this.sudo,
      this.voterKeyPairs,
      voteForCouncilFee.add(revealVoteFee).add(this.greaterStake)
    )

    // First K members stake more
    await this.api.sudoStartAnnouncingPeriod(this.sudo, now.addn(100))
    await this.api.batchApplyForCouncilElection(this.applicantKeyPairs.slice(0, this.k), this.greaterStake)
    this.applicantKeyPairs.slice(0, this.k).forEach((keyPair) =>
      this.api.getCouncilElectionStake(keyPair.address).then((stake) => {
        assert(
          stake.eq(this.greaterStake),
          `${keyPair.address} not applied correctly for council election with stake ${stake} versus expected ${this.greaterStake}`
        )
      })
    )

    // Last members stake less
    await this.api.batchApplyForCouncilElection(this.applicantKeyPairs.slice(this.k), this.lesserStake)
    this.applicantKeyPairs.slice(this.k).forEach((keyPair) =>
      this.api.getCouncilElectionStake(keyPair.address).then((stake) => {
        assert(
          stake.eq(this.lesserStake),
          `${keyPair.address} not applied correctrly for council election with stake ${stake} versus expected ${this.lesserStake}`
        )
      })
    )

    // Voting
    await this.api.sudoStartVotingPeriod(this.sudo, now.addn(100))
    await this.api.batchVoteForCouncilMember(
      this.voterKeyPairs.slice(0, this.k),
      this.applicantKeyPairs.slice(0, this.k),
      salt.slice(0, this.k),
      this.lesserStake
    )
    await this.api.batchVoteForCouncilMember(
      this.voterKeyPairs.slice(this.k),
      this.applicantKeyPairs.slice(this.k),
      salt.slice(this.k),
      this.greaterStake
    )

    // Revealing
    await this.api.sudoStartRevealingPeriod(this.sudo, now.addn(100))
    await this.api.batchRevealVote(
      this.voterKeyPairs.slice(0, this.k),
      this.applicantKeyPairs.slice(0, this.k),
      salt.slice(0, this.k)
    )
    await this.api.batchRevealVote(
      this.voterKeyPairs.slice(this.k),
      this.applicantKeyPairs.slice(this.k),
      salt.slice(this.k)
    )
    now = await this.api.getBestBlock()

    // Resolving election
    // 3 is to ensure the revealing block is in future
    await this.api.sudoStartRevealingPeriod(this.sudo, now.addn(3))
    await Utils.wait(this.api.getBlockDuration().muln(2.5).toNumber())
    const seats: Seat[] = await this.api.getCouncil()

    // Assert a council was created
    assert(seats.length)

    // const applicantAddresses: string[] = this.applicantKeyPairs.map((keyPair) => keyPair.address)
    // const voterAddresses: string[] = this.voterKeyPairs.map((keyPair) => keyPair.address)
    // const councilMembers: string[] = seats.map((seat) => seat.member.toString())
    // const backers: string[] = seats.map((seat) => seat.backers.map((backer) => backer.member.toString())).flat()

    if (expectFailure) {
      throw new Error('Successful fixture run while expecting failure')
    }
  }
}
