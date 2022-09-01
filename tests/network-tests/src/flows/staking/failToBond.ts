import { FlowProps } from '../../Flow'
import { BondingRestrictedFixture } from '../../fixtures/staking'
import { BuyMembershipHappyCaseFixture, AddStakingAccountsHappyCaseFixture } from '../../fixtures/membership'
import { extendDebug } from '../../Debugger'
import { FixtureRunner } from '../../Fixture'

export default async function bondingFailure({ api, query }: FlowProps): Promise<void> {
  const debug = extendDebug('flow:bonding-failure')
  debug('Started')
  api.enableDebugTxLogs()

  // Create a member
  const memberAccounts = (await api.createKeyPairs(1)).map(({ key }) => key.address)
  const buyMembershipHappyCaseFixture = new BuyMembershipHappyCaseFixture(api, query, memberAccounts)
  await new FixtureRunner(buyMembershipHappyCaseFixture).runWithQueryNodeChecks()
  const [memberId] = buyMembershipHappyCaseFixture.getCreatedMembers()

  // Add a staking account for new member
  const stakingAccounts = (await api.createKeyPairs(1)).map(({ key }) => key.address)
  const addStakingAccountsHappyCaseFixture = new AddStakingAccountsHappyCaseFixture(
    api,
    query,
    stakingAccounts.map((account) => ({ asMember: memberId, account }))
  )
  await new FixtureRunner(addStakingAccountsHappyCaseFixture).runWithQueryNodeChecks()

  // Stake funds by applying for council
  const candidacyStake = api.consts.council.minCandidateStake
  await api.untilCouncilStage('Announcing')

  const applyForCouncilTx = api.tx.council.announceCandidacy(
    memberId,
    stakingAccounts[0],
    memberAccounts[0],
    candidacyStake
  )
  await api.prepareAccountsForFeeExpenses(memberAccounts, [applyForCouncilTx])
  await api.treasuryTransferBalanceToAccounts(stakingAccounts, candidacyStake)
  await api.sendExtrinsicsAndGetResults([applyForCouncilTx], memberAccounts)

  // Bonding with staking account should fail!
  const bondingAccount = stakingAccounts[0]
  const bondFixutre = new BondingRestrictedFixture(api, {
    stash: bondingAccount,
    controller: bondingAccount,
    bondAmount: await api.query.staking.minValidatorBond(),
  })
  await new FixtureRunner(bondFixutre).run()

  debug('Done')
}
