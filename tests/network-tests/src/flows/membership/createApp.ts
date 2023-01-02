import { AppMetadata } from '@joystream/metadata-protobuf'
import BN from 'bn.js'
import { assert } from 'chai'
import { extendDebug } from '../../Debugger'
import { FixtureRunner } from '../../Fixture'
import { CreateMembersFixture } from '../../fixtures/content'
import { FlowProps } from '../../Flow'

export async function createApp({ api, query }: FlowProps): Promise<void> {
  const debug = extendDebug('flow:create-app')
  debug('Started')

  const createMembersFixture = new CreateMembersFixture(api, query, 1, 0, new BN(10_000_000_000))
  await new FixtureRunner(createMembersFixture).run()
  const [member] = createMembersFixture.getCreatedItems().members

  const newAppName = 'create_me'
  const newAppMetadata: Partial<AppMetadata> = {
    category: 'blockchain',
    oneLiner: 'best blokchain video platform',
    description: 'long description',
    platforms: ['web', 'mobile'],
  }

  await api.createApp(member.memberId, newAppName, newAppMetadata)

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
