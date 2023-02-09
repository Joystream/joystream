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

  const updatedMetadata: Partial<AppMetadata> = {
    description: 'updated description',
    oneLiner: 'updated one liner',
    platforms: ['tv'],
  }

  // app created by member
  const newAppNameOwnedByMember = 'update_app_owned_by_member'
  const newAppMetadataOwnedByMember: Partial<AppMetadata> = {
    category: 'blockchain',
    oneLiner: 'best blockchain video platform',
    description: 'long description',
    platforms: ['web', 'mobile'],
    useUri: 'http://example.com',
  }

  await api.createApp(member.memberId, newAppNameOwnedByMember, newAppMetadataOwnedByMember)

  const appsCreatedByMember = await query.tryQueryWithTimeout(
    () => query.getAppsByName(newAppNameOwnedByMember),
    (appsByName) => {
      assert.equal(appsByName?.[0]?.name, newAppNameOwnedByMember)
      assert.equal(appsByName?.[0]?.ownerMember?.id, member.memberId.toString())
      assert.equal(appsByName?.[0]?.oneLiner, newAppMetadataOwnedByMember.oneLiner)
      assert.equal(appsByName?.[0]?.description, newAppMetadataOwnedByMember.description)
      assert.deepEqual(appsByName?.[0]?.platforms, newAppMetadataOwnedByMember.platforms)
    }
  )

  const newAppCreatedByMemberId = appsCreatedByMember?.[0]?.id
  if (newAppCreatedByMemberId) {
    await api.updateApp(member.memberId, newAppCreatedByMemberId, updatedMetadata)
  }

  await query.tryQueryWithTimeout(
    () => query.getAppsByName(newAppNameOwnedByMember),
    (appsByName) => {
      assert.equal(appsByName?.[0]?.id, newAppCreatedByMemberId)
      assert.equal(appsByName?.[0]?.name, newAppNameOwnedByMember)
      assert.equal(appsByName?.[0]?.useUri, newAppMetadataOwnedByMember.useUri)
      assert.equal(appsByName?.[0]?.category, newAppMetadataOwnedByMember.category)
      assert.equal(appsByName?.[0]?.description, updatedMetadata.description)
      assert.equal(appsByName?.[0]?.oneLiner, updatedMetadata.oneLiner)
      assert.deepEqual(appsByName?.[0]?.platforms, updatedMetadata.platforms)
    }
  )

  // app created by lead

  const leadId = await api.getLeaderId('contentWorkingGroup')

  const newAppNameOwnedByLead = 'update_app_owned_by_lead'
  const newAppOwnedByLeadMetadata: Partial<AppMetadata> = {
    category: 'blockchain',
    oneLiner: 'best blokchain video platform',
    description: 'long description',
    platforms: ['web', 'mobile'],
  }

  await api.createApp(leadId, newAppNameOwnedByLead, newAppOwnedByLeadMetadata, true)

  const appsCreatedByLead = await query.tryQueryWithTimeout(
    () => query.getAppsByName(newAppNameOwnedByLead),
    (appsByName) => {
      assert.equal(appsByName?.[0]?.name, newAppNameOwnedByLead)
      assert.equal(appsByName?.[0].ownerMember?.id, null)
      assert.equal(appsByName?.[0].isLeadOwned, true)
      assert.equal(appsByName?.[0]?.category, newAppOwnedByLeadMetadata.category)
      assert.equal(appsByName?.[0]?.oneLiner, newAppOwnedByLeadMetadata.oneLiner)
      assert.equal(appsByName?.[0]?.description, newAppOwnedByLeadMetadata.description)
      assert.equal(appsByName?.[0]?.termsOfService, null)
      assert.equal(appsByName?.[0]?.websiteUrl, null)
      assert.deepEqual(appsByName?.[0]?.platforms, newAppOwnedByLeadMetadata.platforms)
    }
  )

  const newAppOwnedByLeadId = appsCreatedByLead?.[0]?.id
  if (newAppOwnedByLeadId) {
    await api.updateApp(leadId, newAppOwnedByLeadId, updatedMetadata, true)
  }

  await query.tryQueryWithTimeout(
    () => query.getAppsByName(newAppNameOwnedByLead),
    (appsByName) => {
      assert.equal(appsByName?.[0]?.id, newAppOwnedByLeadId)
      assert.equal(appsByName?.[0]?.name, newAppNameOwnedByLead)
      assert.equal(appsByName?.[0]?.ownerMember?.id, null)
      assert.equal(appsByName?.[0]?.useUri, updatedMetadata.useUri)
      assert.equal(appsByName?.[0]?.category, updatedMetadata.category)
      assert.equal(appsByName?.[0]?.description, updatedMetadata.description)
      assert.equal(appsByName?.[0]?.oneLiner, updatedMetadata.oneLiner)
      assert.deepEqual(appsByName?.[0]?.platforms, updatedMetadata.platforms)
    }
  )

  debug('done')
}
