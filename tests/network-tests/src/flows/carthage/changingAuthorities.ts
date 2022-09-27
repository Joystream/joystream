import { extendDebug } from 'src/Debugger'
import { FlowProps } from 'src/Flow'
import { expect } from 'chai'

export default async function changingAuthorities({ api, query, env }: FlowProps): Promise<void> {
  const debug = extendDebug('flow: authority set is changing after swith to NPoS')
  debug('started')
  api.enableDebugTxLogs()

  const nBlocks = 100

  // I cannot be 100% sure that next authorities have changed, since election process for babe
  // is non deterministic
  // checking whether election have happened so far
  await api.untilBlock(nBlocks)
  const electionRounds = api.getElectionRounds()
  expect(electionRounds).to.be.above(0)
}
