import { ApiWrapper } from '../../utils/apiWrapper'
import { KeyringPair } from '@polkadot/keyring/types'
import BN from 'bn.js'
import { assert } from 'chai'
import { Seat } from '@nicaea/types/council'
import { v4 as uuid } from 'uuid'
import { Utils } from '../../utils/utils'
import { Fixture } from './interfaces/fixture'

export class ElectCouncilFixture implements Fixture {
  private apiWrapper: ApiWrapper
  private m1KeyPairs: KeyringPair[]
  private m2KeyPairs: KeyringPair[]
  private k: number
  private sudo: KeyringPair
  private greaterStake: BN
  private lesserStake: BN

  public constructor(
    apiWrapper: ApiWrapper,
    m1KeyPairs: KeyringPair[],
    m2KeyPairs: KeyringPair[],
    k: number,
    sudo: KeyringPair,
    greaterStake: BN,
    lesserStake: BN
  ) {
    this.apiWrapper = apiWrapper
    this.m1KeyPairs = m1KeyPairs
    this.m2KeyPairs = m2KeyPairs
    this.k = k
    this.sudo = sudo
    this.greaterStake = greaterStake
    this.lesserStake = lesserStake
  }

  public async runner(expectFailure: boolean): Promise<void> {
    let now = await this.apiWrapper.getBestBlock()
    const applyForCouncilFee: BN = this.apiWrapper.estimateApplyForCouncilFee(this.greaterStake)
    const voteForCouncilFee: BN = this.apiWrapper.estimateVoteForCouncilFee(
      this.sudo.address,
      this.sudo.address,
      this.greaterStake
    )
    const salt: string[] = []
    this.m1KeyPairs.forEach(() => {
      salt.push(''.concat(uuid().replace(/-/g, '')))
    })
    const revealVoteFee: BN = this.apiWrapper.estimateRevealVoteFee(this.sudo.address, salt[0])

    // Topping the balances
    await this.apiWrapper.transferBalanceToAccounts(
      this.sudo,
      this.m2KeyPairs,
      applyForCouncilFee.add(this.greaterStake)
    )
    await this.apiWrapper.transferBalanceToAccounts(
      this.sudo,
      this.m1KeyPairs,
      voteForCouncilFee.add(revealVoteFee).add(this.greaterStake)
    )

    // First K members stake more
    await this.apiWrapper.sudoStartAnnouncingPerion(this.sudo, now.addn(100))
    await this.apiWrapper.batchApplyForCouncilElection(this.m2KeyPairs.slice(0, this.k), this.greaterStake)
    this.m2KeyPairs.slice(0, this.k).forEach((keyPair) =>
      this.apiWrapper.getCouncilElectionStake(keyPair.address).then((stake) => {
        assert(
          stake.eq(this.greaterStake),
          `${keyPair.address} not applied correctly for council election with stake ${stake} versus expected ${this.greaterStake}`
        )
      })
    )

    // Last members stake less
    await this.apiWrapper.batchApplyForCouncilElection(this.m2KeyPairs.slice(this.k), this.lesserStake)
    this.m2KeyPairs.slice(this.k).forEach((keyPair) =>
      this.apiWrapper.getCouncilElectionStake(keyPair.address).then((stake) => {
        assert(
          stake.eq(this.lesserStake),
          `${keyPair.address} not applied correctrly for council election with stake ${stake} versus expected ${this.lesserStake}`
        )
      })
    )

    // Voting
    await this.apiWrapper.sudoStartVotingPerion(this.sudo, now.addn(100))
    await this.apiWrapper.batchVoteForCouncilMember(
      this.m1KeyPairs.slice(0, this.k),
      this.m2KeyPairs.slice(0, this.k),
      salt.slice(0, this.k),
      this.lesserStake
    )
    await this.apiWrapper.batchVoteForCouncilMember(
      this.m1KeyPairs.slice(this.k),
      this.m2KeyPairs.slice(this.k),
      salt.slice(this.k),
      this.greaterStake
    )

    // Revealing
    await this.apiWrapper.sudoStartRevealingPerion(this.sudo, now.addn(100))
    await this.apiWrapper.batchRevealVote(
      this.m1KeyPairs.slice(0, this.k),
      this.m2KeyPairs.slice(0, this.k),
      salt.slice(0, this.k)
    )
    await this.apiWrapper.batchRevealVote(
      this.m1KeyPairs.slice(this.k),
      this.m2KeyPairs.slice(this.k),
      salt.slice(this.k)
    )
    now = await this.apiWrapper.getBestBlock()

    // Resolving election
    // 3 is to ensure the revealing block is in future
    await this.apiWrapper.sudoStartRevealingPerion(this.sudo, now.addn(3))
    await Utils.wait(this.apiWrapper.getBlockDuration().muln(2.5).toNumber())
    const seats: Seat[] = await this.apiWrapper.getCouncil()

    // Preparing collections to increase assertion readability
    const m2addresses: string[] = this.m2KeyPairs.map((keyPair) => keyPair.address)
    const m1addresses: string[] = this.m1KeyPairs.map((keyPair) => keyPair.address)
    const members: string[] = seats.map((seat) => seat.member.toString())
    const bakers: string[] = seats.map((seat) => seat.backers.map((baker) => baker.member.toString())).flat()

    // Assertions
    m2addresses.forEach((address) => assert(members.includes(address), `Account ${address} is not in the council`))
    m1addresses.forEach((address) => assert(bakers.includes(address), `Account ${address} is not in the voters`))
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
