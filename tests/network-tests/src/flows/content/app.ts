import { AppActionMetadata, AppMetadata, ChannelMetadata } from '@joystream/metadata-protobuf'
import BN from 'bn.js'
import { assert } from 'chai'
import { Api } from 'src/Api'
import { QueryNodeApi } from 'src/QueryNodeApi'
import { extendDebug } from '../../Debugger'
import { FixtureRunner } from '../../Fixture'
import {
  CreateChannelsAndVideosFixture,
  CreateContentStructureFixture,
  CreateMembersFixture,
  IMember,
} from '../../fixtures/content'
import { FlowProps } from '../../Flow'
import { createJoystreamCli } from '../utils'
import { Utils } from '../../utils'
import { Option } from '@polkadot/types'
import { AnyMetadataClass } from '@joystream/metadata-protobuf/types'
import { PalletContentStorageAssetsRecord } from '@polkadot/types/lookup'
import { Bytes } from '@polkadot/types/primitive'
import { createType } from '@joystream/types'
import { ed25519PairFromString, ed25519Sign } from '@polkadot/util-crypto'
import { u8aToHex } from '@polkadot/util'
import { CreateChannelsAsMemberFixture } from '../../misc/createChannelsAsMemberFixture'

const sufficientTopupAmount = new BN(10_000_000_000_000)

export async function createApp({ api, query }: FlowProps): Promise<void> {
  const debug = extendDebug('flow:create-app')
  debug('Started')

  // create author of channels and videos
  const createMembersFixture = new CreateMembersFixture(api, query, 3, 0, sufficientTopupAmount)
  await new FixtureRunner(createMembersFixture).run()
  const [member] = createMembersFixture.getCreatedItems().members

  const channelId = await getChannelId(api, query, member)

  const newAppName = 'create_me'
  const newAppMetadata: Partial<AppMetadata> = {
    category: 'blockchain',
    oneLiner: 'best blokchain video platform',
    description: 'long description',
    platforms: ['web', 'mobile'],
  }

  await api.createApp(member.memberId, channelId, newAppName, newAppMetadata)

  await query.tryQueryWithTimeout(
    () => query.getAppsByName(newAppName),
    (appsByName) => {
      assert.equal(appsByName?.[0]?.name, newAppName)
      assert.equal(appsByName?.[0]?.category, newAppMetadata.category)
      assert.equal(appsByName?.[0]?.oneLiner, newAppMetadata.oneLiner)
      assert.equal(appsByName?.[0]?.description, newAppMetadata.description)
      assert.equal(appsByName?.[0]?.termsOfService, null)
      assert.equal(appsByName?.[0]?.websiteUrl, null)
      assert.deepEqual(appsByName?.[0]?.platforms, newAppMetadata.platforms)
    }
  )

  debug('done')
}

export async function updateApp({ api, query }: FlowProps): Promise<void> {
  const debug = extendDebug('flow:update-app')
  debug('Started')

  // create author of channels and videos
  const createMembersFixture = new CreateMembersFixture(api, query, 3, 0, sufficientTopupAmount)
  await new FixtureRunner(createMembersFixture).run()
  const [member] = createMembersFixture.getCreatedItems().members

  const channelId = await getChannelId(api, query, member)

  const appToUpdateName = 'update_me'
  const appMetadataToUpdate: Partial<AppMetadata> = {
    category: 'blockchain',
    oneLiner: 'best blokchain video platform',
    description: 'long description',
    platforms: ['web', 'mobile'],
  }

  await api.createApp(member.memberId, channelId, appToUpdateName, appMetadataToUpdate)

  const apps = await query.tryQueryWithTimeout(
    () => query.getAppsByName(appToUpdateName),
    (appsByName) => {
      assert.equal(appsByName?.[0]?.name, appToUpdateName)
      assert.equal(appsByName?.[0]?.category, appMetadataToUpdate.category)
      assert.equal(appsByName?.[0]?.oneLiner, appMetadataToUpdate.oneLiner)
      assert.equal(appsByName?.[0]?.description, appMetadataToUpdate.description)
      assert.equal(appsByName?.[0]?.termsOfService, null)
      assert.equal(appsByName?.[0]?.websiteUrl, null)
      assert.deepEqual(appsByName?.[0]?.platforms, appMetadataToUpdate.platforms)
    }
  )

  const updatedAppData: Partial<AppMetadata> = {
    category: 'sport',
    oneLiner: 'best sport video platform',
    description: '',
    websiteUrl: 'http://example.com',
    platforms: ['web', 'mobile'],
  }

  const newAppId = apps?.[0]?.id
  if (newAppId) {
    await api.updateApp(member.memberId, channelId, newAppId, updatedAppData)
  }

  await query.tryQueryWithTimeout(
    () => query.getAppsByName(appToUpdateName),
    (appsByName) => {
      assert.equal(appsByName?.[0]?.name, appToUpdateName)
      assert.equal(appsByName?.[0]?.category, updatedAppData.category)
      assert.equal(appsByName?.[0]?.oneLiner, updatedAppData.oneLiner)
      assert.equal(appsByName?.[0]?.description, updatedAppData.description)
      assert.equal(appsByName?.[0]?.termsOfService, '')
      assert.equal(appsByName?.[0]?.websiteUrl, updatedAppData.websiteUrl)
      assert.deepEqual(appsByName?.[0]?.platforms, updatedAppData.platforms)
    }
  )

  debug('done')
}

export async function createAppAction({ api, query }: FlowProps): Promise<void> {
  const debug = extendDebug('flow:create-app-actions')
  debug('Started')
  // create author of channels and videos
  const createMembersFixture = new CreateMembersFixture(api, query, 3, 0, sufficientTopupAmount)
  await new FixtureRunner(createMembersFixture).run()
  const [member] = createMembersFixture.getCreatedItems().members
  const createChannelFixture = new CreateChannelsAsMemberFixture(api, query, member.memberId.toNumber(), 2)

  const appChannelId = await getChannelId(api, query, member)

  const keypair = ed25519PairFromString('fake_secret')
  const newAppName = 'app_action_1'
  const newAppMetadata: Partial<AppMetadata> = {
    category: 'blockchain',
    oneLiner: 'best blokchain video platform',
    description: 'description',
    platforms: ['web'],
    authKey: u8aToHex(keypair.publicKey),
  }

  await api.createApp(member.memberId, appChannelId, newAppName, newAppMetadata)
  const appFragment = await query.tryQueryWithTimeout(
    () => query.getAppsByName(newAppName),
    (apps) => {
      assert.equal(apps?.[0].name, newAppName)
    }
  )

  // const nonce = await query.chan([member.memberId.toString()])

  const channelInput = {
    title: `Channel from ${appFragment?.[0].name} app`,
    description: 'This is the app channel',
    isPublic: true,
    language: 'en',
  }
  const appActionMeta = {
    // todo change naming
    nonceId: '1',
  }
  const appChannelCommitment = generateAppActionCommitment(
    member.memberId.toString(),
    createType('Option<PalletContentStorageAssetsRecord>', null),
    metadataToBytes(ChannelMetadata, channelInput),
    metadataToBytes(AppActionMetadata, appActionMeta)
  )
  const signature = u8aToHex(ed25519Sign(appChannelCommitment, keypair, true))
  const appChannelInput = {
    appId: appFragment?.[0].id,
    channelMetadata: channelInput,
    signature,
    metadata: appActionMeta,
  }
  debug(appChannelInput)
  debug(keypair)
  const storageBuckets = await createChannelFixture.selectStorageBucketsForNewChannel()
  const distBuckets = await createChannelFixture.selectDistributionBucketsForNewChannel()
  const account = await api.getMemberControllerAccount(member.memberId.toNumber())

  const channelId = await api.createMockChannel(
    member.memberId.toNumber(),
    storageBuckets,
    distBuckets,
    account,
    appChannelInput
  )
  debug(channelId)

  await query.tryQueryWithTimeout(
    () => query.channelById(channelId.toString()),
    (channel) => {
      Utils.assert(channel, 'Channel not found')
      assert.equal(channel.title, appChannelInput.channelMetadata?.title)
      assert.equal(channel.description, appChannelInput.channelMetadata?.description)
      assert.equal(channel.isPublic, appChannelInput.channelMetadata?.isPublic)
      assert.equal(channel.language?.iso, appChannelInput.channelMetadata?.language)
      assert.equal(channel.app?.id, appFragment?.[0].id)
    }
  )

  debug('done')
}

async function getChannelId(api: Api, query: QueryNodeApi, member: IMember) {
  const videoCount = 0
  const videoCategoryCount = 0
  const channelCount = 1

  // create channel categories and video categories
  const joystreamCli = await createJoystreamCli()
  const createContentStructureFixture = new CreateContentStructureFixture(api, query, joystreamCli, videoCategoryCount)
  await new FixtureRunner(createContentStructureFixture).run()

  const { videoCategoryIds } = createContentStructureFixture.getCreatedItems()

  // create channels and videos
  const createChannelsAndVideos = new CreateChannelsAndVideosFixture(
    api,
    query,
    joystreamCli,
    channelCount,
    videoCount,
    videoCategoryIds[0],
    member
  )
  await new FixtureRunner(createChannelsAndVideos).run()

  const [channelId] = createChannelsAndVideos.getCreatedItems().channelIds

  return channelId
}

export function generateAppActionCommitment(
  creatorId: string,
  assets: Option<PalletContentStorageAssetsRecord>,
  rawAction: Bytes,
  rawAppMetadata: Bytes
): string {
  return JSON.stringify([creatorId, assets.toString(), rawAction, rawAppMetadata])
}

export function metadataToBytes<T>(metaClass: AnyMetadataClass<T>, obj: T): Bytes {
  return createType('Bytes', metadataToString(metaClass, obj))
}

export function metadataToString<T>(metaClass: AnyMetadataClass<T>, obj: T): string {
  return '0x' + Buffer.from(metaClass.encode(obj).finish()).toString('hex')
}
