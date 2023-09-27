import { FlowProps } from '../../Flow'
import { BuyMembershipHappyCaseFixture } from '../../fixtures/membership'

import { extendDebug } from '../../Debugger'
import { FixtureRunner } from '../../Fixture'
import { VerifyValidatorAccountFixture } from '../../fixtures/membership/VerifyValidatorAccountFixture'

export default async function validatorAccount({ api, query }: FlowProps): Promise<void> {
  const debug = extendDebug('flow:validator-account-update')
  debug('Started')
  api.enableDebugTxLogs()

  const VerifyValidator = [
    {
      memberId: '1',
      validatorAccount: 'validator address',
    },
    {
      memberId: '2',
      validatorAccount: '',
    },
  ]

  const verifyAccountFixture = new VerifyValidatorAccountFixture(api, query, VerifyValidator)
  const remarkModerateRunner = new FixtureRunner(verifyAccountFixture)
  await remarkModerateRunner.run()
  await remarkModerateRunner.runQueryNodeChecks()

  debug('Done')
}
