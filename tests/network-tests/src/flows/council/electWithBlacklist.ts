import { FlowProps } from '../../Flow'
import { extendDebug } from '../../Debugger'
import { FixtureRunner } from '../../Fixture'
import { VotersOptingOut } from '../../fixtures/council/VotersOptingOut'

export default async function failToElectWithBlacklist({ api, query }: FlowProps): Promise<void> {
  const debug = extendDebug('flow:elect-council')
  debug('Started')
  api.enableDebugTxLogs()

  const votersOptOut = new VotersOptingOut(api, query)
  await new FixtureRunner(votersOptOut).run()
  debug('Done')
}
