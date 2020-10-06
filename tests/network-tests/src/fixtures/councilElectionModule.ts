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
  private membersKeyPairs: KeyringPair[]
  private councilKeyPairs: KeyringPair[]
  private k: number
  private sudo: KeyringPair
  private greaterStake: BN
  private lesserStake: BN

  public constructor(
    api: Api,
    membersKeyPairs: KeyringPair[],
    councilKeyPairs: KeyringPair[],
    k: number,
    sudo: KeyringPair,
    greaterStake: BN,
    lesserStake: BN
  ) {
    this.api = api
    this.membersKeyPairs = membersKeyPairs
    this.councilKeyPairs = councilKeyPairs
    this.k = k
    this.sudo = sudo
    this.greaterStake = greaterStake
    this.lesserStake = lesserStake
  }

  public async runner(expectFailure: boolean): Promise<void> {
    let now = await this.api.getBestBlock()
    const applyForCouncilFee: BN = this.api.estimateApplyForCouncilFee(this.greaterStake)
    const voteForCouncilFee: BN = this.api.estimateVoteForCouncilFee(
      this.sudo.address,
      this.sudo.address,
      this.greaterStake
    )
    const salt: string[] = []
    this.membersKeyPairs.forEach(() => {
      salt.push(''.concat(uuid().replace(/-/g, '')))
    })
    const revealVoteFee: BN = this.api.estimateRevealVoteFee(this.sudo.address, salt[0])

    // Topping the balances
    await this.api.transferBalanceToAccounts(this.sudo, this.councilKeyPairs, applyForCouncilFee.add(this.greaterStake))
    await this.api.transferBalanceToAccounts(
      this.sudo,
      this.membersKeyPairs,
      voteForCouncilFee.add(revealVoteFee).add(this.greaterStake)
    )

    // First K members stake more
    await this.api.sudoStartAnnouncingPeriod(this.sudo, now.addn(100))
    await this.api.batchApplyForCouncilElection(this.councilKeyPairs.slice(0, this.k), this.greaterStake)
    this.councilKeyPairs.slice(0, this.k).forEach((keyPair) =>
      this.api.getCouncilElectionStake(keyPair.address).then((stake) => {
        assert(
          stake.eq(this.greaterStake),
          `${keyPair.address} not applied correctly for council election with stake ${stake} versus expected ${this.greaterStake}`
        )
      })
    )

    // Last members stake less
    await this.api.batchApplyForCouncilElection(this.councilKeyPairs.slice(this.k), this.lesserStake)
    this.councilKeyPairs.slice(this.k).forEach((keyPair) =>
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
      this.membersKeyPairs.slice(0, this.k),
      this.councilKeyPairs.slice(0, this.k),
      salt.slice(0, this.k),
      this.lesserStake
    )
    await this.api.batchVoteForCouncilMember(
      this.membersKeyPairs.slice(this.k),
      this.councilKeyPairs.slice(this.k),
      salt.slice(this.k),
      this.greaterStake
    )

    // Revealing
    await this.api.sudoStartRevealingPeriod(this.sudo, now.addn(100))
    await this.api.batchRevealVote(
      this.membersKeyPairs.slice(0, this.k),
      this.councilKeyPairs.slice(0, this.k),
      salt.slice(0, this.k)
    )
    await this.api.batchRevealVote(
      this.membersKeyPairs.slice(this.k),
      this.councilKeyPairs.slice(this.k),
      salt.slice(this.k)
    )
    now = await this.api.getBestBlock()

    // Resolving election
    // 3 is to ensure the revealing block is in future
    await this.api.sudoStartRevealingPeriod(this.sudo, now.addn(3))
    await Utils.wait(this.api.getBlockDuration().muln(2.5).toNumber())
    const seats: Seat[] = await this.api.getCouncil()

    // Preparing collections to increase assertion readability
    const councilAddresses: string[] = this.councilKeyPairs.map((keyPair) => keyPair.address)
    const membersAddresses: string[] = this.membersKeyPairs.map((keyPair) => keyPair.address)
    const members: string[] = seats.map((seat) => seat.member.toString())
    const bakers: string[] = seats.map((seat) => seat.backers.map((baker) => baker.member.toString())).flat()

    // Assertions
    councilAddresses.forEach((address) => assert(members.includes(address), `Account ${address} is not in the council`))
    membersAddresses.forEach((address) => assert(bakers.includes(address), `Account ${address} is not in the voters`))
    seats.forEach((seat) =>
      assert(
        Utils.getTotalStake(seat).eq(this.greaterStake.add(this.lesserStake)),
        `Member ${seat.member} has unexpected stake ${Utils.getTotalStake(seat)}`
      )
    )
    if (expectFailure) {
      throw new Error('Successful fixture run while expecting failure')
    }
  }
}
