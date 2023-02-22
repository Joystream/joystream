import BN from 'bn.js'
import { extendDebug } from '../../Debugger'
import { FlowProps } from '../../Flow'
import { FixtureRunner } from '../../Fixture'
import { CreateMembersFixture } from '../../fixtures/content'
import { assert } from 'chai'
import { AppMetadata } from '@joystream/metadata-protobuf'
import { createJoystreamCli } from '../utils'

export async function deleteApp({ api, query }: FlowProps): Promise<void> {
  const debug = extendDebug('flow:delete-app')
  debug('Started')

  const createMembersFixture = new CreateMembersFixture(api, query, 1, 0, new BN(10_000_000_000))
  await new FixtureRunner(createMembersFixture).run()
  const [member] = createMembersFixture.getCreatedItems().members

  const appToDeleteName = 'app_to_delete'
  const appToDeleteMetadata: Partial<AppMetadata> = {
    category: 'blockchain',
    oneLiner: 'best blokchain video platform',
    description: 'long description',
    platforms: ['web', 'mobile'],
  }

  const joystreamCli = await createJoystreamCli()
  await joystreamCli.init()
  await joystreamCli.importAccount(member.keyringPair)

  await joystreamCli.createApp(member.memberId.toString(), { name: appToDeleteName, ...appToDeleteMetadata })

  const appsByName = await query.tryQueryWithTimeout(
    () => query.getAppsByName(appToDeleteName),
    (appsByName) => {
      assert.equal(appsByName?.[0]?.name, appToDeleteName)
    }
  )

  if (appsByName?.[0]?.id) {
    await joystreamCli.deleteApp(member.memberId.toString(), appsByName?.[0]?.id)

    await query.tryQueryWithTimeout(
      () => query.getAppsByName(appToDeleteName),
      (appsByName) => {
        assert.equal(appsByName?.length, 0)
      }
    )
  }

  debug('done')
}
