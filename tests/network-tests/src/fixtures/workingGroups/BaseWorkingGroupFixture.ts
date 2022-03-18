import { Api } from '../../Api'
import { StandardizedFixture } from '../../Fixture'
import { QueryNodeApi } from '../../QueryNodeApi'
import { WorkingGroupModuleName } from '../../types'

export abstract class BaseWorkingGroupFixture extends StandardizedFixture {
  protected group: WorkingGroupModuleName

  public constructor(api: Api, query: QueryNodeApi, group: WorkingGroupModuleName) {
    super(api, query)
    this.group = group
  }
}
