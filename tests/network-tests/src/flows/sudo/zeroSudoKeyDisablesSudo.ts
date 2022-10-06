import { FlowProps } from '../../Flow'
import { extendDebug } from '../../Debugger'
import { FixtureRunner } from '../../Fixture'
import { SetSudoKeyFixture } from '../../fixtures/sudo/setSudoKey'
import { assert } from 'chai'

export default async function zeroSudoKeyDisablesSudo({ api, query, env }: FlowProps): Promise<void> {
  const debug = extendDebug(`flow:multiple-post-deletions-bug`)
  debug('Started')
  api.enableDebugTxLogs()

  // arrange
  const setSudoKeyFixture = new SetSudoKeyFixture(api, '0x0')
  const fixtureRunner = new FixtureRunner(setSudoKeyFixture)

  // act: set sudo key to zero
  await fixtureRunner.run()

  // assert: any sudo extr. is disabled
  const tx = api.tx.staking.forceNewEra()
  const result = await api.makeSudoCall(tx)
  assert(result.isError)
  debug('done')
}
