import { extendDebug } from '../../Debugger'
import { FlowProps } from '../../Flow'
import { assert } from 'chai'
import { BN } from 'bn.js'

export default async function eraRewardIsZero({ api, query, env }: FlowProps): Promise<void> {
  const debug = extendDebug('flow: bonding succeeds in PoA')
  debug('started')
  api.enableDebugTxLogs()

  const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))
  const sleepTimeSeconds = 20

  // check that we are in poa
  const forceEra = await api.getForceEra()
  assert(forceEra.isForceNone)

  // wait for X seconds
  sleep(sleepTimeSeconds * 1000)

  // 2. Era reward is zero
  const { index } = (await api.getActiveEra()).unwrap()
  const { total } = await api.getErasRewardPoints(index)
  assert.equal(total.toBn(), new BN(0))
}
