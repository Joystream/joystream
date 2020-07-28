import { Keyring } from '@polkadot/api'
import { KeyringPair } from '@polkadot/keyring/types'
import { ApiWrapper } from '../../../utils/apiWrapper'
import { v4 as uuid } from 'uuid'
import BN from 'bn.js'
import { assert } from 'chai'
import { RoleParameters } from '@constantinople/types/lib/roles'
import tap from 'tap'

export function storageRoleParametersProposalTest(
  apiWrapper: ApiWrapper,
  m1KeyPairs: KeyringPair[],
  m2KeyPairs: KeyringPair[],
  keyring: Keyring,
  sudoUri: string
) {
  let sudo: KeyringPair

  tap.test('Storage role parameters proposal test', async () => {
    // Setup
    sudo = keyring.addFromUri(sudoUri)
    const proposalTitle: string = 'Testing proposal ' + uuid().substring(0, 8)
    const description: string = 'Testing validator count proposal ' + uuid().substring(0, 8)
    const runtimeVoteFee: BN = apiWrapper.estimateVoteForProposalFee()
    await apiWrapper.transferBalanceToAccounts(sudo, m2KeyPairs, runtimeVoteFee)
    const roleParameters: RoleParameters = ((await apiWrapper.getStorageRoleParameters()) as unknown) as RoleParameters

    // Proposal stake calculation
    const proposalStake: BN = new BN(100000)
    const proposalFee: BN = apiWrapper.estimateProposeStorageRoleParametersFee(
      description,
      description,
      proposalStake,
      roleParameters.min_stake.toBn(),
      roleParameters.min_actors.toBn(),
      roleParameters.max_actors.toBn(),
      roleParameters.reward.toBn(),
      roleParameters.reward_period.toBn(),
      roleParameters.bonding_period.toBn(),
      roleParameters.unbonding_period.toBn(),
      roleParameters.min_service_period.toBn(),
      roleParameters.startup_grace_period.toBn(),
      roleParameters.entry_request_fee.toBn()
    )
    await apiWrapper.transferBalance(sudo, m1KeyPairs[0].address, proposalFee.add(proposalStake))

    // Proposal creation
    const proposedMinStake: BN = roleParameters.min_stake.toBn().addn(1)
    const proposedMaxActors: BN = roleParameters.max_actors.toBn().addn(1)
    const proposedReward: BN = roleParameters.reward.toBn().addn(1)
    const proposedRewardPeriod: BN = roleParameters.reward_period.toBn().addn(1)
    const proposedBondingPeriod: BN = roleParameters.bonding_period.toBn().addn(1)
    const proposedUnbondingPeriod: BN = roleParameters.unbonding_period.toBn().addn(1)
    const proposedMinServicePeriod: BN = roleParameters.min_service_period.toBn().addn(1)
    const proposedStartupGracePeriod: BN = roleParameters.startup_grace_period.toBn().addn(1)
    const proposedEntryRequestFee: BN = roleParameters.entry_request_fee.toBn().addn(1)
    const proposalPromise = apiWrapper.expectProposalCreated()
    await apiWrapper.proposeStorageRoleParameters(
      m1KeyPairs[0],
      proposalTitle,
      description,
      proposalStake,
      proposedMinStake,
      roleParameters.min_actors.toBn(),
      proposedMaxActors,
      proposedReward,
      proposedRewardPeriod,
      proposedBondingPeriod,
      proposedUnbondingPeriod,
      proposedMinServicePeriod,
      proposedStartupGracePeriod,
      proposedEntryRequestFee
    )
    const proposalNumber = await proposalPromise

    // Approving the proposal
    const proposalExecutionPromise = apiWrapper.expectProposalFinalized()
    await apiWrapper.batchApproveProposal(m2KeyPairs, proposalNumber)
    await proposalExecutionPromise

    // Assertions
    const newRoleParameters: RoleParameters = await apiWrapper.getStorageRoleParameters()
    assert(
      proposedMinStake.eq(newRoleParameters.min_stake.toBn()),
      `Min stake has unexpected value ${newRoleParameters.min_stake.toBn()}, expected ${proposedMinStake}`
    )
    assert(
      proposedMaxActors.eq(newRoleParameters.max_actors.toBn()),
      `Max actors has unexpected value ${newRoleParameters.max_actors.toBn()}, expected ${proposedMaxActors}`
    )
    assert(
      proposedReward.eq(newRoleParameters.reward.toBn()),
      `Reward has unexpected value ${newRoleParameters.reward.toBn()}, expected ${proposedReward}`
    )
    assert(
      proposedRewardPeriod.eq(newRoleParameters.reward_period.toBn()),
      `Reward period has unexpected value ${newRoleParameters.reward_period.toBn()}, expected ${proposedRewardPeriod}`
    )
    assert(
      proposedBondingPeriod.eq(newRoleParameters.bonding_period.toBn()),
      `Bonding period has unexpected value ${newRoleParameters.bonding_period.toBn()}, expected ${proposedBondingPeriod}`
    )
    assert(
      proposedUnbondingPeriod.eq(newRoleParameters.unbonding_period.toBn()),
      `Unbonding period has unexpected value ${newRoleParameters.unbonding_period.toBn()}, expected ${proposedUnbondingPeriod}`
    )
    assert(
      proposedMinServicePeriod.eq(newRoleParameters.min_service_period.toBn()),
      `Min service period has unexpected value ${newRoleParameters.min_service_period.toBn()}, expected ${proposedMinServicePeriod}`
    )
    assert(
      proposedStartupGracePeriod.eq(newRoleParameters.startup_grace_period.toBn()),
      `Startup grace period has unexpected value ${newRoleParameters.startup_grace_period.toBn()}, expected ${proposedStartupGracePeriod}`
    )
    assert(
      proposedEntryRequestFee.eq(newRoleParameters.entry_request_fee.toBn()),
      `Entry request fee has unexpected value ${newRoleParameters.entry_request_fee.toBn()}, expected ${proposedEntryRequestFee}`
    )
  })
}
