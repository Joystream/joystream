import { Fixture } from '../IFixture'
import { ElectCouncilFixture } from './councilElectionModule'
import { Api } from '../Api'
import BN from 'bn.js'

export class CouncilElectionHappyCaseFixture implements Fixture {
  private api: Api
  private voters: string[]
  private applicants: string[]
  private k: number
  private greaterStake: BN
  private lesserStake: BN

  constructor(api: Api, voters: string[], applicants: string[], k: number, greaterStake: BN, lesserStake: BN) {
    this.api = api
    this.voters = voters
    this.applicants = applicants
    this.k = k
    this.greaterStake = greaterStake
    this.lesserStake = lesserStake
  }

  public async runner(expectFailure: boolean): Promise<void> {
    const electCouncilFixture: ElectCouncilFixture = new ElectCouncilFixture(
      this.api,
      this.voters,
      this.applicants,
      this.k,
      this.greaterStake,
      this.lesserStake
    )
    await electCouncilFixture.runner(false)
  }
}
