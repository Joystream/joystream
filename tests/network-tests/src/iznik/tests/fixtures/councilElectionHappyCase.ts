import { Fixture } from './interfaces/fixture'
import { BuyMembershipHappyCaseFixture } from './membershipModule'
import tap from 'tap'
import { ElectCouncilFixture } from './councilElectionModule'
import { ApiWrapper } from '../../utils/apiWrapper'
import { KeyringPair } from '@polkadot/keyring/types'
import { PaidTermId } from '@alexandria/types/members'
import BN from 'bn.js'

export class CouncilElectionHappyCaseFixture implements Fixture {
  private apiWrapper: ApiWrapper
  private sudo: KeyringPair
  private m1KeyPairs: KeyringPair[]
  private m2KeyPairs: KeyringPair[]
  private paidTerms: PaidTermId
  private k: number
  private greaterStake: BN
  private lesserStake: BN

  constructor(
    apiWrapper: ApiWrapper,
    sudo: KeyringPair,
    m1KeyPairs: KeyringPair[],
    m2KeyPairs: KeyringPair[],
    paidTerms: PaidTermId,
    k: number,
    greaterStake: BN,
    lesserStake: BN
  ) {
    this.apiWrapper = apiWrapper
    this.sudo = sudo
    this.m1KeyPairs = m1KeyPairs
    this.m2KeyPairs = m2KeyPairs
    this.paidTerms = paidTerms
    this.k = k
    this.greaterStake = greaterStake
    this.lesserStake = lesserStake
  }

  public async runner(expectFailure: boolean): Promise<void> {
    const firstMemberSetFixture: BuyMembershipHappyCaseFixture = new BuyMembershipHappyCaseFixture(
      this.apiWrapper,
      this.sudo,
      this.m1KeyPairs,
      this.paidTerms
    )
    tap.test('Creating first set of members', async () => firstMemberSetFixture.runner(false))

    const secondMemberSetFixture: BuyMembershipHappyCaseFixture = new BuyMembershipHappyCaseFixture(
      this.apiWrapper,
      this.sudo,
      this.m2KeyPairs,
      this.paidTerms
    )
    tap.test('Creating second set of members', async () => secondMemberSetFixture.runner(false))

    const electCouncilFixture: ElectCouncilFixture = new ElectCouncilFixture(
      this.apiWrapper,
      this.m1KeyPairs,
      this.m2KeyPairs,
      this.k,
      this.sudo,
      this.greaterStake,
      this.lesserStake
    )
    tap.test('Elect council', async () => electCouncilFixture.runner(false))
  }
}
