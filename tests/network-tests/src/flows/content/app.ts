import { AppMetadata } from '@joystream/metadata-protobuf'
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
    description: 'short description',
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
      assert.equal(appsByName?.[0]?.termsOfService, null)
      assert.equal(appsByName?.[0]?.websiteUrl, updatedAppData.websiteUrl)
      assert.deepEqual(appsByName?.[0]?.platforms, updatedAppData.platforms)
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
