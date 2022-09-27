import { extendDebug } from 'src/Debugger'
import { FlowProps } from 'src/Flow'
import { expect } from 'chai'

export default async function constantAuthorities({ api, query, env }: FlowProps): Promise<void> {
  const debug = extendDebug('flow: constant Authorities in PoA')
  debug('started')
  api.enableDebugTxLogs()

  const forceEra = await api.getForceEra()
  expect(forceEra.isForceNone).to.be.true

  const currentAuthorities = await api.getAuthorities()
  const nextAuthorities = await api.getNextAuthorities()
  expect(nextAuthorities).to.be.deep.equal(currentAuthorities)
}
