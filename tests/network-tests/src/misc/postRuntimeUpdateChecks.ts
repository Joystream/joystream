import { assert } from 'chai'
import { FlowProps } from '../Flow'
import { extendDebug } from '../Debugger'
import type { u32 } from '@polkadot/types-codec'

export default async function assertValues({ api }: FlowProps): Promise<void> {
  const debug = extendDebug('flow:postMigrationAssertions')
  debug('Started')

  debug('Check runtime spec version')
  const version = await api.rpc.state.getRuntimeVersion()
  assert.equal(version.specVersion.toNumber(), 2002)

  debug('Check workers limit')
  for (const group of ['storageWorkingGroup', 'distributionWorkingGroup']) {
    const workerLimit = (api.consts[group].maxWorkerNumberLimit as u32).toNumber()
    assert.equal(workerLimit, 50)
  }

  debug('Done')
}
