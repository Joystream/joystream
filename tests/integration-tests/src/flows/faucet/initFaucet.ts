import { FlowProps } from '../../Flow'
import { extendDebug } from '../../Debugger'
import { FixtureRunner } from '../../Fixture'
import { BuyMembershipHappyCaseFixture, TransferInvitesHappyCaseFixture } from '../../fixtures/membership'
import { SetBudgetFixture } from '../../fixtures/workingGroups/SetBudgetFixture'
import { SetLeaderInvitationQuotaFixture } from '../../fixtures/workingGroups/SetLeaderInvitationQuotaFixture'
import _ from 'lodash'
import BN from 'bn.js'

export default async function initFaucet({ api, env, query }: FlowProps): Promise<void> {
  const debug = extendDebug('flow:initFaucet')
  debug('Started')

  // Get membership working group leader
  const membershipWorkingGroup = 'membershipWorkingGroup'
  const [, membershipLeader] = await api.getLeader(membershipWorkingGroup)

  // Grant lead invitation quota
  const setLeaderInvitationQuotaFixture = new SetLeaderInvitationQuotaFixture(api, query, membershipWorkingGroup, 50)
  await new FixtureRunner(setLeaderInvitationQuotaFixture).runWithQueryNodeChecks()

  // The membership working group should have a budget allocated
  const budgets: BN[] = [new BN(1000000)]
  const setGroupBudgetFixture = new SetBudgetFixture(api, query, membershipWorkingGroup, budgets)
  await new FixtureRunner(setGroupBudgetFixture).runWithQueryNodeChecks()

  // Create a membership account for faucet
  const faucetAccounts = [api.createCustomKeyPair(env.SCREENING_AUTHORITY_SEED || '//Faucet').address]
  const happyCaseFixture = new BuyMembershipHappyCaseFixture(api, query, faucetAccounts)
  await new FixtureRunner(happyCaseFixture).runWithQueryNodeChecks()
  const [faucetMemberId] = happyCaseFixture.getCreatedMembers()

  // Give the faucet member accounts some funds (they need some funds for extrinsics)
  await api.treasuryTransferBalanceToAccounts(faucetAccounts, new BN(200))

  // Use the above membershipLeader to give faucet account permission to invite other members
  const transferInvitesHappyCaseFixture = new TransferInvitesHappyCaseFixture(
    api,
    query,
    { memberId: membershipLeader.member_id, account: membershipLeader.role_account_id.toString() },
    { memberId: faucetMemberId, account: faucetAccounts[0] },
    10
  )
  await new FixtureRunner(transferInvitesHappyCaseFixture).runWithQueryNodeChecks()

  debug('Done')
}
