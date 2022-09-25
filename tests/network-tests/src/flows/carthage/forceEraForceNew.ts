import { extendDebug } from 'src/Debugger'
import { FixtureRunner } from 'src/Fixture'
import { FlowProps } from 'src/Flow'
import { Option } from '@polkadot/types'
import { assert } from 'chai'

export default async function forceEraIsNone({ api, query, env }: FlowProps): Promise<void> {
  const debug = extendDebug('flow: validator-set')
  debug('started')
  api.enableDebugTxLogs()

  const currentEra = api.getCurrentEra()
  const forceEra = api.getForceEra()
  assert(currentEra.isSome)
  assert(forceEra.isForceNew)
}
