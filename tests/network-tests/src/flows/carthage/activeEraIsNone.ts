import { extendDebug } from '../../Debugger'
import { FlowProps } from '../../Flow'
import { assert } from 'chai'

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

export default async function activeEraIsNoneInPoA({ api, query, env }: FlowProps): Promise<void> {
  const debug = extendDebug('flow: validator-set')
  debug('started')
  api.enableDebugTxLogs()

  const sleepTimeSeconds = 20

  const forceEra = await api.getForceEra()
  assert(forceEra.isForceNone)

  // wait 10 seconds
  sleep(sleepTimeSeconds * 1000)

  const activeEra = await api.getActiveEra()
  if (activeEra.isSome) {
    const { index } = activeEra.unwrap()
    assert.equal(index.toNumber(), 0)
  }
}
