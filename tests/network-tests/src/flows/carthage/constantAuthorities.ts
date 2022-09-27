import { extendDebug } from 'src/Debugger'
import { FlowProps } from 'src/Flow'
import { expect } from 'chai'

export default async function constantAuthorities({ api, query, env }: FlowProps): Promise<void> {
  const debug = extendDebug('flow: constant Authorities in PoA')
  debug('started')
  api.enableDebugTxLogs()

  const nBlocks = 10

  expect(api.getForceEra().isForceNone).to.be.true

  const pastAuthorities = api.getAuthorities()
  await api.untilBlock(nBlocks)
  const currentAuthorities = api.getAuthorities()
  expect(pastAuthorities).to.be.deep.equal(currentAuthorities)
}
