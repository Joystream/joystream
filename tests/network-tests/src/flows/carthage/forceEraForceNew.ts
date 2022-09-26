import { extendDebug } from 'src/Debugger'
import { FlowProps } from 'src/Flow'
import { expect } from 'chai'

export default async function forceEraIsForceNew({ api, query, env }: FlowProps): Promise<void> {
  const debug = extendDebug('flow: current era era must be some in NPoS')
  debug('started')
  api.enableDebugTxLogs()

  expect(api.getForceEra().isForceNew).to.be.true
  expect(api.getCurrentEra().isSome).to.be.true
}
