import { initConfig } from '../../../utils/config';
import { Keyring, WsProvider } from '@polkadot/api';
import { KeyringPair } from '@polkadot/keyring/types';
import { registerJoystreamTypes } from '@constantinople/types';
import { ApiWrapper } from '../../../utils/apiWrapper';
import { v4 as uuid } from 'uuid';
import BN from 'bn.js';
import { assert } from 'chai';
import { RoleParameters } from '@constantinople/types/lib/roles';
import tap from 'tap';

export function storageRoleParametersProposalTest(m1KeyPairs: KeyringPair[], m2KeyPairs: KeyringPair[]) {
  initConfig();
  const keyring = new Keyring({ type: 'sr25519' });
  const nodeUrl: string = process.env.NODE_URL!;
  const sudoUri: string = process.env.SUDO_ACCOUNT_URI!;
  const defaultTimeout: number = 600000;

  let apiWrapper: ApiWrapper;
  let sudo: KeyringPair;

  tap.setTimeout(defaultTimeout);

  tap.test('Storage role parameters proposal test setup', async () => {
    registerJoystreamTypes();
    const provider = new WsProvider(nodeUrl);
    apiWrapper = await ApiWrapper.create(provider);
  });

  tap.test('Storage role parameters proposal test', async () => {
    // Setup
    sudo = keyring.addFromUri(sudoUri);
    const proposalTitle: string = 'Testing proposal ' + uuid().substring(0, 8);
    const description: string = 'Testing validator count proposal ' + uuid().substring(0, 8);
    const runtimeVoteFee: BN = apiWrapper.estimateVoteForProposalFee();
    await apiWrapper.transferBalanceToAccounts(sudo, m2KeyPairs, runtimeVoteFee);
    const roleParameters: RoleParameters = ((await apiWrapper.getStorageRoleParameters()) as unknown) as RoleParameters;

    // Proposal stake calculation
    const proposalStake: BN = new BN(100000);
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
    );
    await apiWrapper.transferBalance(sudo, m1KeyPairs[0].address, proposalFee.add(proposalStake));

    // Proposal creation
    const proposalPromise = apiWrapper.expectProposalCreated();
    await apiWrapper.proposeStorageRoleParameters(
      m1KeyPairs[0],
      proposalTitle,
      description,
      proposalStake,
      roleParameters.min_stake.toBn().addn(1),
      roleParameters.min_actors.toBn(),
      roleParameters.max_actors.toBn().addn(1),
      roleParameters.reward.toBn().addn(1),
      roleParameters.reward_period.toBn().addn(1),
      roleParameters.bonding_period.toBn().addn(1),
      roleParameters.unbonding_period.toBn().addn(1),
      roleParameters.min_service_period.toBn().addn(1),
      roleParameters.startup_grace_period.toBn().addn(1),
      roleParameters.entry_request_fee.toBn().addn(1)
    );
    const proposalNumber = await proposalPromise;

    // Approving the proposal
    const proposalExecutionPromise = apiWrapper.expectProposalFinalized();
    await apiWrapper.batchApproveProposal(m2KeyPairs, proposalNumber);
    await proposalExecutionPromise;

    // Assertions
    const newRoleParameters: RoleParameters = await apiWrapper.getStorageRoleParameters();
    assert(
      roleParameters.min_stake.toBn().addn(1).eq(newRoleParameters.min_stake.toBn()),
      `Min stake has unexpected value ${newRoleParameters.min_stake.toBn()}, expected ${roleParameters.min_stake
        .toBn()
        .addn(1)}`
    );
    assert(
      roleParameters.max_actors.toBn().addn(1).eq(newRoleParameters.max_actors.toBn()),
      `Max actors has unexpected value ${newRoleParameters.max_actors.toBn()}, expected ${roleParameters.max_actors
        .toBn()
        .addn(1)}`
    );
    assert(
      roleParameters.reward.toBn().addn(1).eq(newRoleParameters.reward.toBn()),
      `Reward has unexpected value ${newRoleParameters.reward.toBn()}, expected ${roleParameters.reward.toBn().addn(1)}`
    );
    assert(
      roleParameters.reward_period.toBn().addn(1).eq(newRoleParameters.reward_period.toBn()),
      `Reward period has unexpected value ${newRoleParameters.reward_period.toBn()}, expected ${roleParameters.reward_period
        .toBn()
        .addn(1)}`
    );
    assert(
      roleParameters.bonding_period.toBn().addn(1).eq(newRoleParameters.bonding_period.toBn()),
      `Bonding period has unexpected value ${newRoleParameters.bonding_period.toBn()}, expected ${roleParameters.bonding_period
        .toBn()
        .addn(1)}`
    );
    assert(
      roleParameters.unbonding_period.toBn().addn(1).eq(newRoleParameters.unbonding_period.toBn()),
      `Unbonding period has unexpected value ${newRoleParameters.unbonding_period.toBn()}, expected ${roleParameters.unbonding_period
        .toBn()
        .addn(1)}`
    );
    assert(
      roleParameters.min_service_period.toBn().addn(1).eq(newRoleParameters.min_service_period.toBn()),
      `Min service period has unexpected value ${newRoleParameters.min_service_period.toBn()}, expected ${roleParameters.min_service_period
        .toBn()
        .addn(1)}`
    );
    assert(
      roleParameters.startup_grace_period.toBn().addn(1).eq(newRoleParameters.startup_grace_period.toBn()),
      `Startup grace period has unexpected value ${newRoleParameters.startup_grace_period.toBn()}, expected ${roleParameters.startup_grace_period
        .toBn()
        .addn(1)}`
    );
    assert(
      roleParameters.entry_request_fee.toBn().addn(1).eq(newRoleParameters.entry_request_fee.toBn()),
      `Entry request fee has unexpected value ${newRoleParameters.entry_request_fee.toBn()}, expected ${roleParameters.entry_request_fee
        .toBn()
        .addn(1)}`
    );
  });

  tap.teardown(() => {
    apiWrapper.close();
  });
}
