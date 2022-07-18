import { assert } from 'chai'
import { Api } from '../../Api'
import { BaseQueryNodeFixture } from '../../Fixture'
import { QueryNodeApi } from '../../QueryNodeApi'
import { JoystreamCLI } from '../../cli/joystream'
import { Utils } from '../../utils'

export class UpdateVideoCategoryFixture extends BaseQueryNodeFixture {
  private cli: JoystreamCLI
  private videoCategoryId: number

  constructor(api: Api, query: QueryNodeApi, cli: JoystreamCLI, videoCategoryId: number) {
    super(api, query)
    this.cli = cli
    this.videoCategoryId = videoCategoryId
  }

  /*
    Execute this Fixture.
  */
  public async execute(): Promise<void> {
    const newName = 'MyNewVideoCategoryName_' + Math.random() // ensure new unique name

    this.debug('Updating video category')
    await this.cli.updateVideoCategory(this.videoCategoryId, newName)

    this.debug('Checking video category update')
    await this.query.tryQueryWithTimeout(
      () => this.query.videoCategoryById(this.videoCategoryId.toString()),
      (entity) => {
        Utils.assert(entity)
        assert.equal(entity.name, newName)
      }
    )
  }
}
