import { extendDebug } from 'src/Debugger'
import { FixtureRunner } from 'src/Fixture'
import { FlowProps } from 'src/Flow'
import BN from 'bn.js'
import { assert } from 'chai'

export default async function constantAuthorities({ api, query, env }: FlowProps): Promise<void> {
  const debug = extendDebug('flow: validator-set')
  debug('started')
  api.enableDebugTxLogs()

  const nBlocks = 10

  const pastAuthorities = await api.getAuthorities()
  await api.untilBlock(nBlocks)
  const currentAuthorities = await api.getAuthorities()
  assert.deepEqual(pastAuthorities, currentAuthorities)
}
