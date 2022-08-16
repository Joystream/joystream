import { FlowProps } from '../../Flow'
import { extendDebug } from '../../Debugger'
import { FixtureRunner } from '../../Fixture'
import { CreateContentStructureFixture } from '../../fixtures/content'
import { createJoystreamCli } from '../utils'

export default async function videoCategories({ api, query, env }: FlowProps): Promise<void> {
  const debug = extendDebug('flow:video-categories')
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
