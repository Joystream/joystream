import { Fixture } from '../IFixture'
import { BuyMembershipHappyCaseFixture } from './membershipModule'
import { ElectCouncilFixture } from './councilElectionModule'
import { Api } from '../Api'
import { KeyringPair } from '@polkadot/keyring/types'
import { PaidTermId } from '@joystream/types/members'
import BN from 'bn.js'

export class CouncilElectionHappyCaseFixture implements Fixture {
  private api: Api
  private sudo: KeyringPair
  private membersKeyPairs: KeyringPair[]
  private councilKeyPairs: KeyringPair[]
  private paidTerms: PaidTermId
  private k: number
  private greaterStake: BN
  private lesserStake: BN

  constructor(
    api: Api,
    sudo: KeyringPair,
    membersKeyPairs: KeyringPair[],
    councilKeyPairs: KeyringPair[],
    paidTerms: PaidTermId,
    k: number,
    greaterStake: BN,
    lesserStake: BN
  ) {
    this.api = api
    this.sudo = sudo
    this.membersKeyPairs = membersKeyPairs
    this.councilKeyPairs = councilKeyPairs
    this.paidTerms = paidTerms
    this.k = k
    this.greaterStake = greaterStake
    this.lesserStake = lesserStake
  }

  public async runner(expectFailure: boolean): Promise<void> {
    const firstMemberSetFixture: BuyMembershipHappyCaseFixture = new BuyMembershipHappyCaseFixture(
      this.api,
      this.sudo,
      this.membersKeyPairs,
      this.paidTerms
    )
    await firstMemberSetFixture.runner(false)

    const secondMemberSetFixture: BuyMembershipHappyCaseFixture = new BuyMembershipHappyCaseFixture(
      this.api,
      this.sudo,
      this.councilKeyPairs,
      this.paidTerms
    )
    await secondMemberSetFixture.runner(false)

    const electCouncilFixture: ElectCouncilFixture = new ElectCouncilFixture(
      this.api,
      this.membersKeyPairs,
      this.councilKeyPairs,
      this.k,
      this.sudo,
      this.greaterStake,
      this.lesserStake
    )
    await electCouncilFixture.runner(false)
  }
}
