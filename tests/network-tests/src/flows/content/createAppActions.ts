import {
  AppAction,
  AppActionMetadata,
  AppMetadata,
  ChannelMetadata,
  ContentMetadata,
  IAppAction,
} from '@joystream/metadata-protobuf'
import BN from 'bn.js'
import { assert } from 'chai'
import { extendDebug } from '../../Debugger'
import { FixtureRunner } from '../../Fixture'
import { CreateMembersFixture } from '../../fixtures/content'
import { FlowProps } from '../../Flow'
import { Utils } from '../../utils'
import { createType } from '@joystream/types'
import { ed25519PairFromString, ed25519Sign } from '@polkadot/util-crypto'
import { stringToHex, u8aToHex } from '@polkadot/util'
import { CreateChannelsAsMemberFixture } from '../../misc/createChannelsAsMemberFixture'
import { Bytes } from '@polkadot/types'
import { createJoystreamCli } from '../utils'

export async function createAppActions({ api, query }: FlowProps): Promise<void> {
  const debug = extendDebug('flow:create-app-actions')
  debug('Started')
  const createMembersFixture = new CreateMembersFixture(api, query, 1, 0, new BN(10_000_000_000))
  await new FixtureRunner(createMembersFixture).run()
  const [member] = createMembersFixture.getCreatedItems().members
  const keypair = ed25519PairFromString('fake_secret')
  const appPublicKeyHex = u8aToHex(keypair.publicKey)
  const appMetadata: Partial<AppMetadata> = {
    category: 'blockchain',
    oneLiner: 'best blokchain video platform',
    description: 'long description',
    platforms: ['web', 'mobile'],
    authKey: appPublicKeyHex,
  }
  const appName = 'app_for_actions'

  const joystreamCli = await createJoystreamCli()
  await joystreamCli.importAccount(member.keyringPair)

  await joystreamCli.createApp(member.memberId.toString(), { name: appName, ...appMetadata })

  const appFragment = await query.tryQueryWithTimeout(
    () => query.getAppsByName(appName),
    (appsByName) => {
      assert.equal(appsByName?.[0]?.name, appName)
      assert.equal(appsByName?.[0].authKey, appPublicKeyHex)
    }
  )
  const appId = appFragment?.[0]?.id as string

  debug('Creating app channel...')
  const channelInput = {
    title: `Channel from ${appName} app`,
    description: 'This is the app channel',
    isPublic: true,
    language: 'en',
  }
  const channelNonce = 0
  const appChannelCommitment = generateAppActionCommitment(
    channelNonce,
    `m:${member.memberId.toString()}`,
    AppAction.ActionType.CREATE_CHANNEL,
    createType('Option<PalletContentStorageAssetsRecord>', null).toU8a(),
    Utils.metadataToBytes(ChannelMetadata, channelInput)
  )
  const signature = ed25519Sign(appChannelCommitment, keypair, true)
  const appChannelInput: IAppAction = {
    appId,
    rawAction: Utils.metadataToBytes(ChannelMetadata, channelInput),
    signature,
    nonce: channelNonce,
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
      assert.equal(channel.entryApp?.id, appId)
      assert.equal(channel.entryApp?.name, appName)
    }
  )

  debug('Creating app video')
  const contentMetadata = {
    videoMetadata: {
      title: 'Mock video for app action',
      description: 'Mock video for app action description',
      duration: 777,
    },
  }
  const videoAppActionMeta = {
    // first video for this channel
    videoId: 'video_id_from_yt',
  }
  const videoNonce = 0
  const appVideoCommitment = generateAppActionCommitment(
    videoNonce,
    channelId.toString(),
    AppAction.ActionType.CREATE_VIDEO,
    createType('Option<PalletContentStorageAssetsRecord>', null).toU8a(),
    Utils.metadataToBytes(ContentMetadata, contentMetadata),
    Utils.metadataToBytes(AppActionMetadata, videoAppActionMeta)
  )
  const videoSignature = ed25519Sign(appVideoCommitment, keypair, true)
  const appVideoInput: IAppAction = {
    appId,
    rawAction: Utils.metadataToBytes(ContentMetadata, contentMetadata),
    signature: videoSignature,
    metadata: Utils.metadataToBytes(AppActionMetadata, videoAppActionMeta),
    nonce: videoNonce,
  }
  const videoId = await api.createMockVideo(member.memberId.toNumber(), channelId.toNumber(), undefined, appVideoInput)

  await query.tryQueryWithTimeout(
    () => query.videoById(videoId.toString()),
    (video) => {
      Utils.assert(video, 'Video not found')
      assert.equal(video.title, contentMetadata.videoMetadata.title)
      assert.equal(video.description, contentMetadata.videoMetadata.description)
      assert.equal(video.duration, contentMetadata.videoMetadata.duration)
      assert.equal(video.entryApp?.id, appId)
      assert.equal(video.entryApp?.name, appName)
      assert.equal(video.ytVideoId, videoAppActionMeta.videoId)
    }
  )

  debug('done')
}

export function generateAppActionCommitment(
  nonce: number,
  creatorId: string,
  type: AppAction.ActionType,
  assets: Uint8Array,
  rawAction?: Bytes,
  rawAppActionMetadata?: Bytes
): string {
  const rawCommitment = [
    nonce,
    creatorId,
    type,
    u8aToHex(assets),
    ...(rawAction ? [u8aToHex(rawAction)] : []),
    ...(rawAppActionMetadata ? [u8aToHex(rawAppActionMetadata)] : []),
  ]
  return stringToHex(JSON.stringify(rawCommitment))
}
