import { extendDebug } from 'src/Debugger'
import { FlowProps } from 'src/Flow'
import { assert } from 'chai'

export default async function currentEraIsNoneInPoA({ api, query, env }: FlowProps): Promise<void> {
  const debug = extendDebug('flow: validator-set')
  debug('started')
  api.enableDebugTxLogs()

  const forceEra = await api.getForceEra()
  assert(forceEra.isForceNone)

  const currentEra = await api.getCurrentEra()
  assert(currentEra.isNone)
}
