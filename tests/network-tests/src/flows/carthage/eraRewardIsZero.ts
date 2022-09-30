import { extendDebug } from '../../Debugger'
import { FlowProps } from '../../Flow'
import { assert } from 'chai'
import { u32 } from '@polkadot/types'

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
  assert.equal(index.toNumber(), 0, 'index not zero')
  const eraReward = await api.getEraValidatorReward(index.addn(1) as u32)
  assert(eraReward.isNone)
}
