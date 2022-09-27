import { extendDebug } from 'src/Debugger'
import { FlowProps } from 'src/Flow'
import { expect } from 'chai'

export default async function constantAuthorities({ api, query, env }: FlowProps): Promise<void> {
  const debug = extendDebug('flow: constant Authorities in PoA')
  debug('started')
  api.enableDebugTxLogs()

  const forceEra = await api.getForceEra()
  expect(forceEra.isForceNone).to.be.true

  // babe authorities
  const currentAuthorities = await api.getBabeAuthorities()
  const nextAuthorities = await api.getNextBabeAuthorities()
  expect(nextAuthorities).to.be.deep.equal(currentAuthorities)

  // make sure that next Session keys are none
  const sessionAuthorities = await api.getSessionAuthorities()
  const queuedKeys = (await api.getQueuedKeys()).map((key) => key[0])
  expect(queuedKeys).to.be.deep.equal(sessionAuthorities)

}
