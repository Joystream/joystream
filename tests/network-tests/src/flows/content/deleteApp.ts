import BN from 'bn.js'
import { extendDebug } from '../../Debugger'
import { FlowProps } from '../../Flow'
import { FixtureRunner } from '../../Fixture'
import { CreateMembersFixture } from '../../fixtures/content'
import { assert } from 'chai'
import { AppAction, AppMetadata, ChannelMetadata, IAppAction } from '@joystream/metadata-protobuf'
import { createType } from '@joystream/types'
import { Utils } from '../../utils'
import { ed25519PairFromString, ed25519Sign } from '@polkadot/util-crypto'
import { CreateChannelsAsMemberFixture } from '../../misc/createChannelsAsMemberFixture'
import { generateAppActionCommitment } from './createAppActions'
import { u8aToHex } from '@polkadot/util'

export async function deleteApp({ api, query }: FlowProps): Promise<void> {
  const debug = extendDebug('flow:delete-app')
  debug('Started')

  const createMembersFixture = new CreateMembersFixture(api, query, 1, 0, new BN(10_000_000_000))
  await new FixtureRunner(createMembersFixture).run()
  const [member] = createMembersFixture.getCreatedItems().members
  const keypair = ed25519PairFromString('fake_secret')
  const appPublicKeyHex = u8aToHex(keypair.publicKey)
  const appToDeleteName = 'app_to_delete'
  const appToDeleteMetadata: Partial<AppMetadata> = {
    category: 'blockchain',
    oneLiner: 'best blokchain video platform',
    description: 'long description',
    platforms: ['web', 'mobile'],
    authKey: appPublicKeyHex,
  }

  await api.createApp(appToDeleteName, appToDeleteMetadata, member.memberId)

  const appsByName = await query.tryQueryWithTimeout(
    () => query.getAppsByName(appToDeleteName),
    (appsByName) => {
      assert.equal(appsByName?.[0]?.name, appToDeleteName)
      assert.equal(appsByName?.[0]?.isDeleted, false)
    }
  )

  if (appsByName?.[0]?.id) {
    await api.deleteApp(appsByName?.[0]?.id, member.memberId)

    await query.tryQueryWithTimeout(
      () => query.getAppsByName(appToDeleteName),
      (appsByName) => {
        assert.equal(appsByName?.[0].name, appToDeleteName)
        assert.equal(appsByName?.[0].isDeleted, true)
      }
    )

    debug('Check app action on deleted app')
    const channelInput = {
      title: `Channel`,
      description: 'This is the app channel',
      isPublic: true,
      language: 'en',
    }
    const appChannelCommitment = generateAppActionCommitment(
      0,
      `m:${member.memberId.toString()}`,
      createType('Option<PalletContentStorageAssetsRecord>', null).toU8a(),
      Utils.metadataToBytes(ChannelMetadata, channelInput)
    )
    const signature = ed25519Sign(appChannelCommitment, keypair, true)
    const appChannelInput: IAppAction = {
      appId: appsByName?.[0]?.id,
      rawAction: Utils.metadataToBytes(ChannelMetadata, channelInput),
      signature,
      nonce: 0,
    }
    const createChannelFixture = new CreateChannelsAsMemberFixture(
      api,
      query,
      member.memberId.toNumber(),
      1,
      Utils.metadataToBytes(AppAction, appChannelInput)
    )
    await createChannelFixture.execute()
    const [channelId] = createChannelFixture.getCreatedChannels()

    await query.tryQueryWithTimeout(
      () => query.channelById(channelId.toString()),
      (channel) => {
        Utils.assert(channel, 'Channel not found')
        assert.equal(channel.title, channelInput.title)
        assert.equal(channel.description, channelInput.description)
        assert.equal(channel.isPublic, channelInput.isPublic)
        assert.equal(channel.language?.iso, channelInput.language)
        assert.equal(channel.entryApp?.id, undefined)
        assert.equal(channel.entryApp?.name, undefined)
      }
    )
  }

  debug('done')
}
