import { extendDebug } from 'src/Debugger'
import { FlowProps } from 'src/Flow'
import { expect } from 'chai'

export default async function constantAuthorities({ api, query, env }: FlowProps): Promise<void> {
  const debug = extendDebug('flow: authority set is changing after swith to NPoS')
  debug('started')
  api.enableDebugTxLogs()

  const nBlocks = 100

  // checking whether election have happened so far
  await api.untilBlock(nBlocks)
  const electionRounds = api.getElectionRounds()
  expect(electionRounds).to.be.above(0)
}
