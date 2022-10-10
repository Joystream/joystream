import { FlowProps } from '../../Flow'
import { extendDebug } from '../../Debugger'
import { FixtureRunner } from '../../Fixture'
import { SetSudoKeyFixture } from '../../fixtures/sudo/setSudoKey'
import { assert } from 'chai'
import { Keyring } from '@polkadot/api';

export default async function zeroSudoKeyDisablesSudo({ api, query, env }: FlowProps): Promise<void> {
  const debug = extendDebug(`flow:zero-sudo-key-disables-sudo`)
  debug('Started')
  api.enableDebugTxLogs()

  // ARRANGE
  const address = 'j4RKcRhyu1wEZQ5SEKLPghzsqfm5vob22eStxDG3xsz87UMkD' // 0x0 address
  const keyring = new Keyring({ type: 'sr25519' })
  const pair = keyring.addFromUri('ZeroAccount')
  const setSudoKeyFixture = new SetSudoKeyFixture(api, pair.address)
  const fixtureRunner = new FixtureRunner(setSudoKeyFixture)

  // ACT
  // set sudo key to zero
  await fixtureRunner.run()

  // ASSERT
  // 1. sudo key updated
  const sudoKey = await api.query.sudo.key()
  assert.deepEqual(sudoKey.toString(), address)

  // 2. pallet sudo disabled
  const tx = api.tx.staking.forceNewEra()
  const result = await api.makeSudoCall(tx)
  assert(result.isError)
  debug('done')
}
