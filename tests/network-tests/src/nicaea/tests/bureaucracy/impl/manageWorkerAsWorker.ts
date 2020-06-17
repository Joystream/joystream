import tap from 'tap';
import BN from 'bn.js';
import { assert } from 'chai';
import { ApiWrapper } from '../../../utils/apiWrapper';
import { KeyringPair } from '@polkadot/keyring/types';
import { Keyring } from '@polkadot/api';
import { v4 as uuid } from 'uuid';

export function manageWorkerAsWorker(
  apiWrapper: ApiWrapper,
  membersKeyPairs: KeyringPair[],
  keyring: Keyring,
  sudoUri: string
) {
  let sudo: KeyringPair;

  tap.test('Manage worker as worker', async () => {
    // Fee estimation and transfer
    sudo = keyring.addFromUri(sudoUri);
    const increaseStakeFee: BN = apiWrapper.estimateIncreaseWorkerStakeFee();
    const updateRoleAccountFee: BN = apiWrapper.estimateUpdateRoleAccountFee(sudo.address);
    const updateRewardAccountFee: BN = apiWrapper.estimateUpdateRewardAccountFee(sudo.address);
    const stakeIncrement: BN = new BN(4);
    const leaveWorkerRole: BN = apiWrapper.estimateLeaveWorkerRoleFee('some text longer than expected in test');
    await apiWrapper.transferBalance(
      sudo,
      membersKeyPairs[0].address,
      increaseStakeFee.add(updateRoleAccountFee).add(updateRewardAccountFee).add(leaveWorkerRole).add(stakeIncrement)
    );
    const workerId: BN = await apiWrapper.getWorkerIdByRoleAccount(membersKeyPairs[0].address);

    // Increase worker stake
    const increasedWorkerStake: BN = (await apiWrapper.getWorkerStakeAmount(workerId)).add(stakeIncrement);
    await apiWrapper.increaseWorkerStake(membersKeyPairs[0], workerId, stakeIncrement);
    const newWorkerStake: BN = await apiWrapper.getWorkerStakeAmount(workerId);
    assert(
      increasedWorkerStake.eq(newWorkerStake),
      `Unexpected worker stake ${newWorkerStake}, expected ${increasedWorkerStake}`
    );

    // Update reward account
    const createdAccount: KeyringPair = keyring.addFromUri(uuid().substring(0, 8));
    await apiWrapper.updateRewardAccount(membersKeyPairs[0], workerId, createdAccount.address);
    const newRewardAccount: string = await apiWrapper.getWorkerRewardAccount(workerId);
    assert(
      newRewardAccount === createdAccount.address,
      `Unexpected role account ${newRewardAccount}, expected ${createdAccount.address}`
    );

    // Update role account
    await apiWrapper.updateRoleAccount(membersKeyPairs[0], workerId, createdAccount.address);
    const newRoleAccount: string = (await apiWrapper.getWorker(workerId)).role_account.toString();
    assert(
      newRoleAccount === createdAccount.address,
      `Unexpected role account ${newRoleAccount}, expected ${createdAccount.address}`
    );

    membersKeyPairs[0] = createdAccount;
  });
}
