import { extendDebug } from 'src/Debugger'
import { FlowProps } from 'src/Flow'
import { assert } from 'chai'
import BN from 'bn.js'

export default async function constantAuthorities({ api, query, env }: FlowProps): Promise<void> {
  const debug = extendDebug('flow: validator-set')
  debug('started')
  api.enableDebugTxLogs()

  const nBlocks = 100

  // checking whether election have happened so far
  await api.untilBlock(nBlocks)
  const electionRounds = api.getElectionRounds()
  assert.isTrue(electionRounds > new BN(0))
}
