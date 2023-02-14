import {
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
import { u8aToHex, stringToHex } from '@polkadot/util'
import { CreateChannelsAsMemberFixture } from '../../misc/createChannelsAsMemberFixture'
import { Bytes } from '@polkadot/types'

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
  const appOwnedByMember = 'app_owned_by_member_for_actions'
  await api.createApp(appOwnedByMember, appMetadata, member.memberId)

  const appFragment = await query.tryQueryWithTimeout(
    () => query.getAppsByName(appOwnedByMember),
    (appsByName) => {
      assert.equal(appsByName?.[0]?.name, appOwnedByMember)
      assert.equal(appsByName?.[0].authKey, appPublicKeyHex)
    }
  )

  debug('Creating app channel...')
  const createChannelFixture = new CreateChannelsAsMemberFixture(api, query, member.memberId.toNumber(), 2)
  const channelInput = {
    title: `Channel from ${appFragment?.[0].name} app`,
    description: 'This is the app channel',
    isPublic: true,
    language: 'en',
  }
  const appActionMeta = {
    // first channel for this member
    nonce: '0',
  }
  const appChannelCommitment = generateAppActionCommitment(
    member.memberId.toString(),
    createType('Option<PalletContentStorageAssetsRecord>', null).toU8a(),
    Utils.metadataToBytes(ChannelMetadata, channelInput),
    Utils.metadataToBytes(AppActionMetadata, appActionMeta)
  )
  const signature = u8aToHex(ed25519Sign(appChannelCommitment, keypair, true))
  const appChannelInput = {
    appId: appFragment?.[0].id,
    channelMetadata: channelInput,
    signature,
    metadata: appActionMeta,
  }
  const storageBuckets = await createChannelFixture.selectStorageBucketsForNewChannel()
  const distBuckets = await createChannelFixture.selectDistributionBucketsForNewChannel()
  const channelId = await api.createMockChannel(
    member.memberId.toNumber(),
    storageBuckets,
    distBuckets,
    undefined,
    appChannelInput
  )

  await query.tryQueryWithTimeout(
    () => query.channelById(channelId.toString()),
    (channel) => {
      Utils.assert(channel, 'Channel not found')
      assert.equal(channel.title, appChannelInput.channelMetadata?.title)
      assert.equal(channel.description, appChannelInput.channelMetadata?.description)
      assert.equal(channel.isPublic, appChannelInput.channelMetadata?.isPublic)
      assert.equal(channel.language?.iso, appChannelInput.channelMetadata?.language)
      assert.equal(channel.entryApp?.id, appFragment?.[0].id)
      assert.equal(channel.entryApp?.name, appFragment?.[0].name)
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
    nonce: '0',
    videoId: 'video_id_from_yt',
  }
  const appVideoCommitment = generateAppActionCommitment(
    channelId.toString(),
    createType('Option<PalletContentStorageAssetsRecord>', null).toU8a(),
    Utils.metadataToBytes(ContentMetadata, contentMetadata),
    Utils.metadataToBytes(AppActionMetadata, videoAppActionMeta)
  )
  const videoSignature = u8aToHex(ed25519Sign(appVideoCommitment, keypair, true))
  const appVideoInput: IAppAction = {
    appId: appFragment?.[0].id,
    contentMetadata: contentMetadata,
    signature: videoSignature,
    metadata: videoAppActionMeta,
  }
  const videoId = await api.createMockVideo(member.memberId.toNumber(), channelId.toNumber(), undefined, appVideoInput)

  await query.tryQueryWithTimeout(
    () => query.videoById(videoId.toString()),
    (video) => {
      Utils.assert(video, 'Video not found')
      assert.equal(video.title, appVideoInput.contentMetadata?.videoMetadata?.title)
      assert.equal(video.description, appVideoInput.contentMetadata?.videoMetadata?.description)
      assert.equal(video.duration, appVideoInput.contentMetadata?.videoMetadata?.duration)
      assert.equal(video.entryApp?.id, appFragment?.[0].id)
      assert.equal(video.entryApp?.name, appFragment?.[0].name)
      assert.equal(video.ytVideoId, appVideoInput.metadata?.videoId)
    }
  )

  debug('done')
}

export function generateAppActionCommitment(
  creatorId: string,
  assets: Uint8Array,
  rawAction: Bytes,
  rawAppActionMetadata: Bytes
): string {
  const rawCommitment = [creatorId, u8aToHex(assets), u8aToHex(rawAction), u8aToHex(rawAppActionMetadata)]
  return stringToHex(JSON.stringify(rawCommitment))
}
