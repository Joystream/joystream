import { FlowProps } from '../../Flow'
import { extendDebug } from '../../Debugger'
import { FixtureRunner } from '../../Fixture'
import { ElectCouncilFixture } from '../../fixtures/council/ElectCouncilFixture'

export default (skipIfAlreadyElected = true) =>
  async function electCouncil({ api, query }: FlowProps): Promise<void> {
    const councilors = await api.query.council.councilMembers()
    const debug = extendDebug('flow:elect-council')
    debug('Started')

    if (councilors.length) {
      if (skipIfAlreadyElected) {
        debug('Council already elected, skipping...')
        return
      }
    }
    api.enableDebugTxLogs()

    const electCouncilFixture = new ElectCouncilFixture(api, query)
    await new FixtureRunner(electCouncilFixture).run()

    debug('Done')
  }
