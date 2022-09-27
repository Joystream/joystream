import { extendDebug } from 'src/Debugger'
import { FlowProps } from 'src/Flow'
import { assert } from 'chai'

export default async function currentEraIsSomeInPoS({ api, query, env }: FlowProps): Promise<void> {
  const debug = extendDebug('flow: current era era must be some in NPoS')
  debug('started')
  api.enableDebugTxLogs()

  const forceEra = await api.getForceEra()
  assert(forceEra.isForceNew)

  const currentEra = await api.getCurrentEra()
  assert(currentEra.isSome)
}
