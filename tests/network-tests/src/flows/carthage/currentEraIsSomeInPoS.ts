import { extendDebug } from 'src/Debugger'
import { FlowProps } from 'src/Flow'
import { expect } from 'chai'

export default async function currentEraIsSomeInPoS({ api, query, env }: FlowProps): Promise<void> {
  const debug = extendDebug('flow: current era era must be some in NPoS')
  debug('started')
  api.enableDebugTxLogs()

  const forceEra = await api.getForceEra()
  expect(forceEra.isForceNew).to.be.true

  const currentEra = await api.getCurrentEra()
  expect(currentEra.isSome).to.be.true
}
