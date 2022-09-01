import { FlowProps } from '../../Flow'
import { extendDebug } from '../../Debugger'
import { FixtureRunner } from '../../Fixture'
import { CreateContentStructureFixture } from '../../fixtures/content'
import { createJoystreamCli } from '../utils'
import BN from 'bn.js'

export async function testVideoCategories({ api, query }: FlowProps): Promise<void> {
  const debug = extendDebug('flow:test-video-categories')
  debug('Started')

  // create Joystream CLI
  const joystreamCli = await createJoystreamCli()

  // settings
  const videoCategoryCount = 2

  // flow itself

  // create channel categories and video categories
  const createContentStructureFixture = new CreateContentStructureFixture(api, query, joystreamCli, videoCategoryCount)
  await new FixtureRunner(createContentStructureFixture).run()
}

export async function populateVideoCategories({ api }: FlowProps): Promise<void> {
  const debug = extendDebug('flow:populate-video-categories')
  debug('Started')

  // create Joystream CLI
  const joystreamCli = await createJoystreamCli()
  // load leader key - it can be any member, but we're sure that content leader will have a membership
  const [memberId] = await api.getLeader('contentWorkingGroup')
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const address = (await api.getMemberControllerAccount(memberId.toNumber()))!
  const keypair = await api.getKeypair(address)
  await joystreamCli.importAccount(keypair)

  debug('Topping up account')
  await api.treasuryTransferBalanceToAccounts([address], new BN(10_000_000_000))

  // settings
  const videoCategories = ['Action', 'Adventure', 'Comedy', 'Drama']

  // flow itself
  for (const videoCategory of videoCategories) {
    await joystreamCli.createVideoCategory(videoCategory)
  }

  debug('Done')
}
