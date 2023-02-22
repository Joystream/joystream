import BN from 'bn.js'
import { extendDebug } from '../../Debugger'
import { FlowProps } from '../../Flow'
import { FixtureRunner } from '../../Fixture'
import { CreateMembersFixture } from '../../fixtures/content'
import { assert } from 'chai'
import { AppMetadata } from '@joystream/metadata-protobuf'
import { createJoystreamCli } from '../utils'

export async function updateApp({ api, query }: FlowProps): Promise<void> {
  const debug = extendDebug('flow:update-app')
  debug('Started')

  const createMembersFixture = new CreateMembersFixture(api, query, 1, 0, new BN(10_000_000_000))
  await new FixtureRunner(createMembersFixture).run()
  const [member] = createMembersFixture.getCreatedItems().members

  const joystreamCli = await createJoystreamCli()
  await joystreamCli.init()
  await joystreamCli.importAccount(member.keyringPair)

  const updatedMetadata: Partial<AppMetadata> = {
    description: 'updated description',
    oneLiner: 'updated one liner',
    platforms: ['tv'],
  }

  const newAppName = 'update_app'
  const newAppMetadata: Partial<AppMetadata> = {
    category: 'blockchain',
    oneLiner: 'best blockchain video platform',
    description: 'long description',
    platforms: ['web', 'mobile'],
    useUri: 'http://example.com',
  }

  await joystreamCli.createApp(member.memberId.toString(), { name: newAppName, ...newAppMetadata })

  const appsByName = await query.tryQueryWithTimeout(
    () => query.getAppsByName(newAppName),
    (appsByName) => {
      assert.equal(appsByName?.[0]?.name, newAppName)
      assert.equal(appsByName?.[0]?.ownerMember.id, member.memberId.toString())
      assert.equal(appsByName?.[0]?.oneLiner, newAppMetadata.oneLiner)
      assert.equal(appsByName?.[0]?.description, newAppMetadata.description)
      assert.deepEqual(appsByName?.[0]?.platforms, newAppMetadata.platforms)
    }
  )

  const newAppId = appsByName?.[0]?.id
  if (newAppId) {
    await joystreamCli.updateApp(member.memberId.toString(), newAppId, updatedMetadata)
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
