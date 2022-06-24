import { createType } from '@joystream/types'
import {
  ChannelPrivilegeLevel,
  ContentModerationAction,
  ContentModerationActionsSet,
  CuratorGroupId,
  ModerationPermissionsByLevel,
} from '@joystream/types/content'
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
    contentModerationActionSet: (keyof typeof ContentModerationAction.typeDefinitions)[]
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

  protected async getContentWgLeadAccount(): Promise<string> {
    const contentWgLead = await this.api.query.contentWorkingGroup.currentLead()
    if (contentWgLead.isNone) {
      throw new Error('Content working group lead not set!')
    }

    return (await this.api.query.contentWorkingGroup.workerById(contentWgLead.unwrap())).role_account_id.toString()
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

  protected createcontentModerationActionSetType(
    actionSet: (keyof typeof ContentModerationAction.typeDefinitions)[],
    permissionToDeleteNftAssets: boolean
  ): ContentModerationAction[] {
    return actionSet.map((a) =>
      createType<ContentModerationAction, 'ContentModerationAction'>(
        'ContentModerationAction',
        a === 'DeleteVideo'
          ? { DeleteVideo: null }
          : a === 'DeleteChannel'
          ? { DeleteChannel: null }
          : a === 'DeleteVideoAssets'
          ? { DeleteVideoAssets: permissionToDeleteNftAssets }
          : a === 'HideChannel'
          ? { HideChannel: null }
          : a === 'HideVideo'
          ? { HideVideo: null }
          : a === 'DeleteNonVideoChannelAssets'
          ? { DeleteNonVideoChannelAssets: null }
          : a === 'UpdateChannelNftLimits'
          ? { UpdateChannelNftLimits: null }
          : { ChangeChannelFeatureStatus: { CreatorCashout: null } }
      )
    )
  }

  protected async createCuratorGroup(): Promise<SubmittableExtrinsic<'promise'>[]> {
    return this.curatorGroupParams.map(({ isActive, permissionsByLevel }) => {
      const moderationPermissionsByLevel = createType<ModerationPermissionsByLevel, 'ModerationPermissionsByLevel'>(
        'ModerationPermissionsByLevel',
        new Map(
          permissionsByLevel.map(
            ({ channelPrivilegeLevel, contentModerationActionSet, permissionToDeleteNftAssets }) => {
              return [
                createType<ChannelPrivilegeLevel, 'ChannelPrivilegeLevel'>(
                  'ChannelPrivilegeLevel',
                  channelPrivilegeLevel
                ),
                createType<ContentModerationActionsSet, 'ContentModerationActionsSet'>(
                  'ContentModerationActionsSet',
                  this.createcontentModerationActionSetType(contentModerationActionSet, permissionToDeleteNftAssets)
                ),
              ]
            }
          )
        )
      )

      return this.api.tx.content.createCuratorGroup(
        isActive,
        createType<ModerationPermissionsByLevel, 'ModerationPermissionsByLevel'>(
          'ModerationPermissionsByLevel',
          moderationPermissionsByLevel
        )
      )
    })
  }
}
