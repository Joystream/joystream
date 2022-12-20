import BN from 'bn.js'
import { extendDebug } from '../../Debugger'
import { FlowProps } from '../../Flow'
import { FixtureRunner } from '../../Fixture'
import { CreateMembersFixture } from '../../fixtures/content'
import { assert } from 'chai'
import { AppMetadata } from '@joystream/metadata-protobuf'

export async function updateApp({ api, query }: FlowProps): Promise<void> {
  const debug = extendDebug('flow:update-app')
  debug('Started')

  const createMembersFixture = new CreateMembersFixture(api, query, 1, 0, new BN(10_000_000_000))
  await new FixtureRunner(createMembersFixture).run()
  const [member] = createMembersFixture.getCreatedItems().members

  const newAppName = 'update_me'
  const newAppMetadata: Partial<AppMetadata> = {
    category: 'blockchain',
    oneLiner: 'best blockchain video platform',
    description: 'long description',
    platforms: ['web', 'mobile'],
    useUri: 'http://example.com',
  }

  await api.createApp(member.memberId, newAppName, newAppMetadata)

  const apps = await query.tryQueryWithTimeout(
    () => query.getAppsByName(newAppName),
    (appsByName) => {
      assert.equal(appsByName?.[0]?.name, newAppName)
      assert.equal(appsByName?.[0]?.oneLiner, newAppMetadata.oneLiner)
      assert.equal(appsByName?.[0]?.description, newAppMetadata.description)
      assert.deepEqual(appsByName?.[0]?.platforms, newAppMetadata.platforms)
    }
  )

  const updatedMetadata: Partial<AppMetadata> = {
    description: 'updated description',
    oneLiner: 'updated one liner',
    platforms: [],
  }

  const newAppId = apps?.[0]?.id
  if (newAppId) {
    await api.updateApp(member.memberId, newAppId, updatedMetadata)
  }

  await query.tryQueryWithTimeout(
    () => query.getAppsByName(newAppName),
    (appsByName) => {
      assert.equal(appsByName?.[0]?.id, newAppId)
      assert.equal(appsByName?.[0]?.name, newAppName)
      assert.equal(appsByName?.[0]?.useUri, newAppMetadata.useUri)
      assert.equal(appsByName?.[0]?.category, newAppMetadata.category)
      assert.equal(appsByName?.[0]?.description, updatedMetadata.description)
      assert.equal(appsByName?.[0]?.oneLiner, updatedMetadata.oneLiner)
      assert.deepEqual(appsByName?.[0]?.platforms, updatedMetadata.platforms)
    }
  )

  debug('done')
}
