import { CreateInterface, createType } from '@joystream/types'
import { CuratorGroupId } from '@joystream/types/primitives'
import {
  PalletContentPermissionsCuratorGroupIterableEnumsContentModerationAction as ContentModerationAction,
  PalletContentPermissionsCuratorGroupIterableEnumsPausableChannelFeature as PausableChannelFeature,
} from '@polkadot/types/lookup'
import { SubmittableExtrinsic } from '@polkadot/api/types'
import { Api } from '../../Api'
import { KNOWN_WORKER_ROLE_ACCOUNT_DEFAULT_BALANCE } from '../../consts'
import { BaseQueryNodeFixture } from '../../Fixture'
import { QueryNodeApi } from '../../QueryNodeApi'

export type CuratorGroupParams = {
  isActive: boolean
  permissionsByLevel: {
    channelPrivilegeLevel: number
    permissionToDeleteNftAssets: boolean
    contentModerationActionSet: ContentModerationAction['type'][]
  }[]
}

export class CreateCuratorGroupFixture extends BaseQueryNodeFixture {
  protected curatorGroupParams: CuratorGroupParams[]
  protected createdCuratorGroupId: CuratorGroupId | undefined

  public constructor(api: Api, query: QueryNodeApi, curatorGroupParams: CuratorGroupParams[]) {
    super(api, query)
    this.curatorGroupParams = curatorGroupParams
    this.createdCuratorGroupId = undefined
  }

  public getCreatedCuratorGroupId(): CuratorGroupId {
    return this.createdCuratorGroupId as CuratorGroupId
  }

  public async getContentWgLeadAccount(): Promise<string> {
    const contentWgLead = await this.api.query.contentWorkingGroup.currentLead()
    if (contentWgLead.isNone) {
      throw new Error('Content working group lead not set!')
    }

    return (await this.api.query.contentWorkingGroup.workerById(contentWgLead.unwrap()))
      .unwrap()
      .roleAccountId.toString()
  }

  public async execute(): Promise<void> {
    this.debug('Creating Curator Group')

    const signer = await this.getContentWgLeadAccount()
    await this.api.treasuryTransferBalance(signer, KNOWN_WORKER_ROLE_ACCOUNT_DEFAULT_BALANCE)

    const extrinsics = await this.createCuratorGroup()
    const [result] = await this.api.sendExtrinsicsAndGetResults(extrinsics, signer)
    const event = this.api.findEvent(result, 'content', 'CuratorGroupCreated')

    if (event) {
      this.createdCuratorGroupId = event.data[0]
    }
  }

  protected createContentModerationActionSetType(
    actionSet: ContentModerationAction['type'][],
    value: null | boolean | PausableChannelFeature
  ): CreateInterface<ContentModerationAction>[] {
    return actionSet.map(
      (action) =>
        ({ [action]: value } as {
          [K in ContentModerationAction['type']]: ContentModerationAction[`is${K}`]
        })
    )
  }

  protected async createCuratorGroup(): Promise<SubmittableExtrinsic<'promise'>[]> {
    return this.curatorGroupParams.map(({ isActive, permissionsByLevel }) => {
      const moderationPermissionsByLevel = createType(
        'BTreeMap<u8,BTreeSet<PalletContentPermissionsCuratorGroupIterableEnumsContentModerationAction>>',
        new Map(
          permissionsByLevel.map(
            ({ channelPrivilegeLevel, contentModerationActionSet, permissionToDeleteNftAssets }) => {
              return [
                channelPrivilegeLevel,
                this.createContentModerationActionSetType(contentModerationActionSet, permissionToDeleteNftAssets),
              ]
            }
          )
        )
      )

      return this.api.tx.content.createCuratorGroup(isActive, moderationPermissionsByLevel)
    })
  }
}
