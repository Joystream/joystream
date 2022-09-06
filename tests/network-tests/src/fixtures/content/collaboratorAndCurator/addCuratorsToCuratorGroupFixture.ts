import { createType } from '@joystream/types'
import { PalletContentChannelActionPermission as ChannelActionPermission } from '@polkadot/types/lookup'
import { WorkerId, CuratorGroupId } from '@joystream/types/primitives'
import { SubmittableExtrinsic } from '@polkadot/api/types'
import { KNOWN_WORKER_ROLE_ACCOUNT_DEFAULT_BALANCE } from '../../../consts'
import { Api } from '../../../Api'
import { BaseQueryNodeFixture } from '../../../Fixture'
import { QueryNodeApi } from '../../../QueryNodeApi'
import { assertCuratorCollaboratorPermissions } from './utils'
import { Utils } from '../../../utils'

export type AddCuratorToGroupParams = {
  curatorGroupId: CuratorGroupId
  curatorId: WorkerId
  permissions: ChannelActionPermission['type'][]
}

export class AddCuratorToCuratorGroupFixture extends BaseQueryNodeFixture {
  protected addCuratorToGroupParams: AddCuratorToGroupParams[]

  public constructor(api: Api, query: QueryNodeApi, addCuratorToGroupParams: AddCuratorToGroupParams[]) {
    super(api, query)
    this.addCuratorToGroupParams = addCuratorToGroupParams
  }

  protected async getContentWgLeadAccount(): Promise<string> {
    const contentWgLead = await this.api.query.contentWorkingGroup.currentLead()
    if (contentWgLead.isNone) {
      throw new Error('Content working group lead not set!')
    }

    return (await this.api.query.contentWorkingGroup.workerById(contentWgLead.unwrap()))
      .unwrap()
      .roleAccountId.toString()
  }

  public async execute(): Promise<void> {
    this.debug('Adding  Curators to Curator Group')

    const signer = await this.getContentWgLeadAccount()
    await this.api.treasuryTransferBalance(signer, KNOWN_WORKER_ROLE_ACCOUNT_DEFAULT_BALANCE)

    const extrinsics = await this.addCuratorToGroup()

    await this.api.sendExtrinsicsAndGetResults(extrinsics, signer)
  }

  protected async addCuratorToGroup(): Promise<SubmittableExtrinsic<'promise'>[]> {
    return this.addCuratorToGroupParams.map(({ curatorGroupId, curatorId, permissions }) =>
      this.api.tx.content.addCuratorToGroup(
        curatorGroupId,
        curatorId,
        createType('BTreeSet<PalletContentChannelActionPermission>', permissions)
      )
    )
  }

  public async checkCuratorPermissions(curatorIndex: number): Promise<void> {
    await this.query.tryQueryWithTimeout(
      () =>
        this.query.getCuratorPermissionsByIdAndGroupId(
          this.addCuratorToGroupParams[curatorIndex].curatorGroupId.toString(),
          this.addCuratorToGroupParams[curatorIndex].curatorId.toString()
        ),
      (curator) => {
        Utils.assert(curator)
        assertCuratorCollaboratorPermissions(
          this.addCuratorToGroupParams[curatorIndex].permissions,
          curator.permissions
        )
      }
    )
  }
}
