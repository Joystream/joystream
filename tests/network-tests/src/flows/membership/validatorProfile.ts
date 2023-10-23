import { FlowProps } from '../../Flow'
import { BuyMembershipHappyCaseFixture } from '../../fixtures/membership'

import { extendDebug } from '../../Debugger'
import { FixtureRunner } from '../../Fixture'
import { VerifyValidatorProfileFixture } from '../../fixtures/membership/VerifyValidatorAccountFixture'

export default async function validatorAccount({ api, query }: FlowProps): Promise<void> {
  const debug = extendDebug('flow:validator-account-update')
  debug('Started')
  api.enableDebugTxLogs()

  const VerifyValidator = [
    {
      memberId: "1" ,
      isVerified: true,
    },
    {
      memberId: "2",
      isVerified: true,
      asWorker: 'j4VEC6FcJtBrwYQKhBAoB6Rj83jDeVua6azuHBrri1zoksBkz',
    },
    {
      memberId: "2",
      isVerified: false,
      asWorker: '5DckbE8f7Zhm8jnPQTA1Z5ciy4ZoiDFVWCHhUB7FdAvTfjf3s',
    },
  ]

  const verifyAccountFixture = new VerifyValidatorProfileFixture(api, query, VerifyValidator)
  const remarkModerateRunner = new FixtureRunner(verifyAccountFixture)
  await remarkModerateRunner.run()
  await remarkModerateRunner.runQueryNodeChecks()

  debug('Done')
}
