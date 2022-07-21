import { assert } from 'chai'
import { Api } from '../../Api'
import { BaseQueryNodeFixture } from '../../Fixture'
import { QueryNodeApi } from '../../QueryNodeApi'
import { JoystreamCLI } from '../../cli/joystream'
import { Utils } from '../../utils'

export class DeleteVideoCategoryFixture extends BaseQueryNodeFixture {
  private cli: JoystreamCLI
  private videoCategoryId: string

  constructor(api: Api, query: QueryNodeApi, cli: JoystreamCLI, videoCategoryId: string) {
    super(api, query)
    this.cli = cli
    this.videoCategoryId = videoCategoryId
  }

  /*
    Execute this Fixture.
  */
  public async execute(): Promise<void> {
    this.debug('Deleting video category')
    await this.cli.deleteVideoCategory(this.videoCategoryId)

    this.debug('Checking video category deletion')
    await this.query.tryQueryWithTimeout(
      () => this.query.videoCategoryById(this.videoCategoryId.toString()),
      (entity) => {
        Utils.assert(!entity)
      }
    )
  }
}
