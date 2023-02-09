import BN from 'bn.js'
import { extendDebug } from '../../Debugger'
import { FlowProps } from '../../Flow'
import { FixtureRunner } from '../../Fixture'
import { CreateMembersFixture } from '../../fixtures/content'
import { assert } from 'chai'
import { AppMetadata } from '@joystream/metadata-protobuf'

export async function deleteApp({ api, query }: FlowProps): Promise<void> {
  const debug = extendDebug('flow:delete-app')
  debug('Started')

  const createMembersFixture = new CreateMembersFixture(api, query, 1, 0, new BN(10_000_000_000))
  await new FixtureRunner(createMembersFixture).run()
  const [member] = createMembersFixture.getCreatedItems().members

  // app created by member
  const appToDeleteNameOwnedByMember = 'delete_app_owned_by_member'
  const appToDeleteMetadataOwnedByMember: Partial<AppMetadata> = {
    category: 'blockchain',
    oneLiner: 'best blokchain video platform',
    description: 'long description',
    platforms: ['web', 'mobile'],
  }

  await api.createApp(member.memberId, appToDeleteNameOwnedByMember, appToDeleteMetadataOwnedByMember)

  const appsCreatedByMember = await query.tryQueryWithTimeout(
    () => query.getAppsByName(appToDeleteNameOwnedByMember),
    (appsByName) => {
      assert.equal(appsByName?.[0]?.name, appToDeleteNameOwnedByMember)
    }
  )

  if (appsCreatedByMember?.[0]?.id) {
    await api.deleteApp(member.memberId, appsCreatedByMember?.[0]?.id)

    await query.tryQueryWithTimeout(
      () => query.getAppsByName(appToDeleteNameOwnedByMember),
      (appsByName) => {
        assert.equal(appsByName?.length, 0)
      }
    )
  }

  // app created by lead
  const leadId = await api.getLeaderId('contentWorkingGroup')

  const appToDeleteNameOwnedByLead = 'delete_app_owned_by_lead'
  const appToDeleteMetadataOwnedByLead: Partial<AppMetadata> = {
    category: 'blockchain',
    oneLiner: 'best blokchain video platform',
    description: 'long description',
    platforms: ['web', 'mobile'],
  }

  await api.createApp(leadId, appToDeleteNameOwnedByLead, appToDeleteMetadataOwnedByLead, true)

  const appsCreatedByLead = await query.tryQueryWithTimeout(
    () => query.getAppsByName(appToDeleteNameOwnedByLead),
    (appsByName) => {
      assert.equal(appsByName?.[0]?.name, appToDeleteNameOwnedByLead)
    }
  )

  if (appsCreatedByLead?.[0]?.id) {
    await api.deleteApp(leadId, appsCreatedByLead?.[0]?.id, true)

    await query.tryQueryWithTimeout(
      () => query.getAppsByName(appToDeleteNameOwnedByLead),
      (appsByName) => {
        assert.equal(appsByName?.length, 0)
      }
    )
  }

  debug('done')
}
