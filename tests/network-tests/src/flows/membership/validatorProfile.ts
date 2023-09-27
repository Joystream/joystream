import { FlowProps } from '../../Flow'
import { BuyMembershipHappyCaseFixture } from '../../fixtures/membership'

import { extendDebug } from '../../Debugger'
import { FixtureRunner } from '../../Fixture'
import { VerifyValidatorAccountFixture } from '../../fixtures/membership/VerifyValidatorAccountFixture'

export default async function validatorAccount({ api, query }: FlowProps): Promise<void> {
  const debug = extendDebug('flow:validator-account-update')
  debug('Started')
  api.enableDebugTxLogs()

  const [account] = (await api.createKeyPairs(1)).map(({ key }) => key.address)
  const buyMembershipHappyCaseFixture = new BuyMembershipHappyCaseFixture(api, query, [account])
  await new FixtureRunner(buyMembershipHappyCaseFixture).run()

  const [memberId] = buyMembershipHappyCaseFixture.getCreatedMembers()
  const [verifyAccount] = (await api.createKeyPairs(2)).map(({ key }) => key.address)

  const updateVerifyAccount = new VerifyValidatorAccountFixture(
    api,
    query,
    {
      account,
      memberId,
    },
    verifyAccount
  )
  await new FixtureRunner(updateVerifyAccount).runWithQueryNodeChecks()

  debug('Done')
}
