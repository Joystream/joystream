import { assert } from 'chai'
import { FlowProps } from '../Flow'
import { extendDebug } from '../Debugger'
import type { u32 } from '@polkadot/types-codec'
import { createType } from '@joystream/types'

export default async function assertValues({ api }: FlowProps): Promise<void> {
  const debug = extendDebug('flow:postRuntimeUpdateChecks')
  debug('Started')

  debug('Check runtime spec version')
  const version = await api.rpc.state.getRuntimeVersion()
  assert.equal(version.specVersion.toNumber(), 2002)

  // Damping factor after runtime should be 100% = default
  debug('Council Damping factor initial value')
  const dampingFactor = await api.query.council.eraPayoutDampingFactor()
  assert(dampingFactor.eqn(100), 'Damping factor should be default = 100%')

  debug('Done')
}
