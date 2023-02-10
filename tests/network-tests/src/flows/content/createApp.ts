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

  const appMetadata: Partial<AppMetadata> = {
    category: 'blockchain',
    oneLiner: 'best blokchain video platform',
    description: 'long description',
    platforms: ['web', 'mobile'],
  }

  // app created by member
  const appOwnedByMember = 'app_owned_by_member'

  await api.createApp(appOwnedByMember, appMetadata, member.memberId)

  await query.tryQueryWithTimeout(
    () => query.getAppsByName(appOwnedByMember),
    (appsByName) => {
      assert.equal(appsByName?.[0]?.name, appOwnedByMember)
      assert.equal(appsByName?.[0].ownerMember?.id, member.memberId.toString())
      assert.equal(appsByName?.[0].isLeadOwned, false)
      assert.equal(appsByName?.[0]?.category, appMetadata.category)
      assert.equal(appsByName?.[0]?.oneLiner, appMetadata.oneLiner)
      assert.equal(appsByName?.[0]?.description, appMetadata.description)
      assert.equal(appsByName?.[0]?.termsOfService, null)
      assert.equal(appsByName?.[0]?.websiteUrl, null)
      assert.deepEqual(appsByName?.[0]?.platforms, appMetadata.platforms)
    }
  )

  // app created by lead

  const appOwnedByLead = 'app_owned_by_lead'
  await api.createApp(appOwnedByLead, appMetadata)

  await query.tryQueryWithTimeout(
    () => query.getAppsByName(appOwnedByLead),
    (appsByName) => {
      assert.equal(appsByName?.[0]?.name, appOwnedByLead)
      assert.equal(appsByName?.[0].ownerMember?.id, null)
      assert.equal(appsByName?.[0].isLeadOwned, true)
      assert.equal(appsByName?.[0]?.category, appMetadata.category)
      assert.equal(appsByName?.[0]?.oneLiner, appMetadata.oneLiner)
      assert.equal(appsByName?.[0]?.description, appMetadata.description)
      assert.equal(appsByName?.[0]?.termsOfService, null)
      assert.equal(appsByName?.[0]?.websiteUrl, null)
      assert.deepEqual(appsByName?.[0]?.platforms, appMetadata.platforms)
    }
  )

  debug('done')
}
