import { AppMetadata } from '@joystream/metadata-protobuf'
import BN from 'bn.js'
import { assert } from 'chai'
import { extendDebug } from '../../Debugger'
import { FixtureRunner } from '../../Fixture'
import { FlowProps } from '../../Flow'
import { createJoystreamCli } from '../utils'
import { CreateMembersFixture } from '../../fixtures/content'

export async function createApp({ api, query }: FlowProps): Promise<void> {
  const debug = extendDebug('flow:create-app')
  debug('Started')

  const createMembersFixture = new CreateMembersFixture(api, query, 1, 0, new BN(10_000_000_000))
  await new FixtureRunner(createMembersFixture).run()
  const [member] = createMembersFixture.getCreatedItems().members

  const joystreamCli = await createJoystreamCli()
  await joystreamCli.importAccount(member.keyringPair)

  const appMetadata: Partial<AppMetadata> = {
    category: 'blockchain',
    oneLiner: 'best blokchain video platform',
    description: 'long description',
    platforms: ['web', 'mobile'],
  }

  const appName = 'test_app'

  await joystreamCli.createApp(member.memberId.toString(), { name: appName, ...appMetadata })

  await query.tryQueryWithTimeout(
    () => query.getAppsByName(appName),
    (appsByName) => {
      assert.equal(appsByName?.[0]?.name, appName)
      assert.equal(appsByName?.[0].ownerMember.id, member.memberId.toString())
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
