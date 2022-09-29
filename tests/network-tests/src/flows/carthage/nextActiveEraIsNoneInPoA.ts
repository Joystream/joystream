import { extendDebug } from '../../Debugger'
import { FlowProps } from '../../Flow'
import { assert } from 'chai'
import { u32 } from '@polkadot/types'

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

export default async function nextActiveEraIsNoneInPoA({ api, query, env }: FlowProps): Promise<void> {
  const debug = extendDebug('flow: active era is none in poa')
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
    const nextEraIndex = index.addn(1)
    const nextSessionIndex = await api.getErasStartSessionIndex(nextEraIndex as u32)
    assert.equal(index.toNumber(), 0)
    assert(nextSessionIndex.isNone)
  }
}
