import { UpdateWorkerAccountsFixture } from './updateWorkerAccountsFixture'

import { FlowProps } from '../Flow'
import { FixtureRunner } from '../Fixture'
import { extendDebug } from '../Debugger'

export default async function updateAllWorkerRoleAccounts({ api }: FlowProps): Promise<void> {
  const debug = extendDebug('flow:updateAllWorkerRoleAccounts')
  debug('Started')

  const updateAccounts = new UpdateWorkerAccountsFixture(api)
  await new FixtureRunner(updateAccounts).run()

  debug('Done')
}
