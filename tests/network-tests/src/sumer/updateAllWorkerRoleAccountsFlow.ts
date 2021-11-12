import { UpdateLeadWorkerAccountsFixture } from './updateWorkerAccountsFixture'

import { FlowProps } from '../Flow'
import { FixtureRunner } from '../Fixture'
import { extendDebug } from '../Debugger'

export default async function updateAllWorkerAccounts({ api }: FlowProps): Promise<void> {
  const debug = extendDebug('flow:updateAllWorkerAccounts')
  debug('Started')

  const updateAccounts = new UpdateLeadWorkerAccountsFixture(api)
  await new FixtureRunner(updateAccounts).run()

  debug('Done')
}
