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

  const appOwnedByMember = 'app_owned_by_member'
  const appOwnedByMemberMetadata: Partial<AppMetadata> = {
    category: 'blockchain',
    oneLiner: 'best blokchain video platform',
    description: 'long description',
    platforms: ['web', 'mobile'],
  }

  await api.createApp(member.memberId, appOwnedByMember, appOwnedByMemberMetadata)

  await query.tryQueryWithTimeout(
    () => query.getAppsByName(appOwnedByMember),
    (appsByName) => {
      assert.equal(appsByName?.[0]?.name, appOwnedByMember)
      assert.equal(appsByName?.[0].ownerMember?.id, member.memberId.toString())
      assert.equal(appsByName?.[0].isLeadOwned, false)
      assert.equal(appsByName?.[0]?.category, appOwnedByMemberMetadata.category)
      assert.equal(appsByName?.[0]?.oneLiner, appOwnedByMemberMetadata.oneLiner)
      assert.equal(appsByName?.[0]?.description, appOwnedByMemberMetadata.description)
      assert.equal(appsByName?.[0]?.termsOfService, null)
      assert.equal(appsByName?.[0]?.websiteUrl, null)
      assert.deepEqual(appsByName?.[0]?.platforms, appOwnedByMemberMetadata.platforms)
    }
  )

  const leadId = await api.getLeaderId('contentWorkingGroup')

  const appOwnedByLead = 'app_owned_by_lead'
  const appOwnedByLeadMetadata: Partial<AppMetadata> = {
    category: 'blockchain',
    oneLiner: 'best blokchain video platform',
    description: 'long description',
    platforms: ['web', 'mobile'],
  }

  await api.createApp(leadId, appOwnedByLead, appOwnedByLeadMetadata, true)

  await query.tryQueryWithTimeout(
    () => query.getAppsByName(appOwnedByLead),
    (appsByName) => {
      assert.equal(appsByName?.[0]?.name, appOwnedByLead)
      assert.equal(appsByName?.[0].ownerMember?.id, null)
      assert.equal(appsByName?.[0].isLeadOwned, true)
      assert.equal(appsByName?.[0]?.category, appOwnedByLeadMetadata.category)
      assert.equal(appsByName?.[0]?.oneLiner, appOwnedByLeadMetadata.oneLiner)
      assert.equal(appsByName?.[0]?.description, appOwnedByLeadMetadata.description)
      assert.equal(appsByName?.[0]?.termsOfService, null)
      assert.equal(appsByName?.[0]?.websiteUrl, null)
      assert.deepEqual(appsByName?.[0]?.platforms, appOwnedByMemberMetadata.platforms)
    }
  )

  debug('done')
}
