import { Api } from '../../../Api'
import { BaseQueryNodeFixture, FixtureRunner } from '../../../Fixture'
import { JoystreamCLI } from '../../../cli/joystream'
import { Debugger, extendDebug } from '../../../Debugger'
import { QueryNodeApi } from '../../../QueryNodeApi'

export class NftAuctionFixture extends BaseQueryNodeFixture {
  private debug: Debugger.Debugger
  private cli: JoystreamCLI

  constructor(api: Api, query: QueryNodeApi, cli: JoystreamCLI) {
    super(api, query)
    this.cli = cli
    this.debug = extendDebug('fixture:NftAuctionFixture')
  }

  /*
    Execute this Fixture.
  */
  public async execute(): Promise<void> {
    // TODO
  }
}
