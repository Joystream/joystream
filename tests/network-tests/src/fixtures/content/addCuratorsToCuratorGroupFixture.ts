import { createType } from '@joystream/types'
import { ChannelActionPermission, ChannelAgentPermissions, CuratorGroupId } from '@joystream/types/content'
import { WorkerId } from '@joystream/types/working-group'
import { SubmittableExtrinsic } from '@polkadot/api/types'
import { KNOWN_WORKER_ROLE_ACCOUNT_DEFAULT_BALANCE } from '../../consts'
import { Api } from '../../Api'
import { BaseQueryNodeFixture } from '../../Fixture'
import { QueryNodeApi } from '../../QueryNodeApi'

export type AddCuratorToGroupParams = {
  curatorGroupId: CuratorGroupId
  curatorId: WorkerId
  permissions: (keyof typeof ChannelActionPermission.typeDefinitions)[]
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

    return (await this.api.query.contentWorkingGroup.workerById(contentWgLead.unwrap())).role_account_id.toString()
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
        createType<ChannelAgentPermissions, 'ChannelAgentPermissions'>('ChannelAgentPermissions', permissions)
      )
    )
  }
}
