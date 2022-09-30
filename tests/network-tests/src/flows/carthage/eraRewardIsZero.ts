import { extendDebug } from '../../Debugger'
import { FlowProps } from '../../Flow'
import { assert } from 'chai'

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

  // get era reward
  const { index } = (await api.getActiveEra()).unwrap()
  const eraReward = await api.getEraValidatorReward(index)
  assert.deepEqual(eraReward.toString(), '0')
}
