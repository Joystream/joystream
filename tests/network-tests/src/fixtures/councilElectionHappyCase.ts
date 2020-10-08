import { Fixture } from '../IFixture'
import { ElectCouncilFixture } from './councilElectionModule'
import { Api } from '../Api'
import { KeyringPair } from '@polkadot/keyring/types'
import BN from 'bn.js'

export class CouncilElectionHappyCaseFixture implements Fixture {
  private api: Api
  private sudo: KeyringPair
  private voterKeyPairs: KeyringPair[]
  private applicantKeyPairs: KeyringPair[]
  private k: number
  private greaterStake: BN
  private lesserStake: BN

  constructor(
    api: Api,
    sudo: KeyringPair,
    voterKeyPairs: KeyringPair[],
    applicantKeyPairs: KeyringPair[],
    k: number,
    greaterStake: BN,
    lesserStake: BN
  ) {
    this.api = api
    this.sudo = sudo
    this.voterKeyPairs = voterKeyPairs
    this.applicantKeyPairs = applicantKeyPairs
    this.k = k
    this.greaterStake = greaterStake
    this.lesserStake = lesserStake
  }

  public async runner(expectFailure: boolean): Promise<void> {
    const electCouncilFixture: ElectCouncilFixture = new ElectCouncilFixture(
      this.api,
      this.voterKeyPairs,
      this.applicantKeyPairs,
      this.k,
      this.sudo,
      this.greaterStake,
      this.lesserStake
    )
    await electCouncilFixture.runner(false)
  }
}
