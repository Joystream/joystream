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
      isVerified: true,
    },
    {
      memberId: '2',
      isVerifiedValidator: true,
      account: 'j4VEC6FcJtBrwYQKhBAoB6Rj83jDeVua6azuHBrri1zoksBkz',
    },
  ]

  const verifyAccountFixture = new VerifyValidatorAccountFixture(api, query, VerifyValidator)
  const remarkModerateRunner = new FixtureRunner(verifyAccountFixture)
  await remarkModerateRunner.run()
  await remarkModerateRunner.runQueryNodeChecks()

  debug('Done')
}
