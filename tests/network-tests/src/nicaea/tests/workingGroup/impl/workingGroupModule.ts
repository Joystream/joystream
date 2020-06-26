import BN from 'bn.js';
import { assert } from 'chai';
import { ApiWrapper } from '../../../utils/apiWrapper';
import { KeyringPair } from '@polkadot/keyring/types';
import { Keyring } from '@polkadot/api';
import { v4 as uuid } from 'uuid';

export async function setLead(apiWrapper: ApiWrapper, lead: KeyringPair, sudo: KeyringPair) {
  await apiWrapper.sudoSetLead(sudo, lead);
}

export async function unsetLead(apiWrapper: ApiWrapper, sudo: KeyringPair) {
  await apiWrapper.sudoUnsetLead(sudo);
}

export async function addWorkerOpening(
  apiWrapper: ApiWrapper,
  membersKeyPairs: KeyringPair[],
  lead: KeyringPair,
  sudo: KeyringPair,
  applicationStake: BN,
  roleStake: BN,
  activationDelay: BN
): Promise<BN> {
  let openingId: BN;

  // Fee estimation and transfer
  const addOpeningFee: BN = apiWrapper.estimateAddOpeningFee();
  await apiWrapper.transferBalance(sudo, lead.address, addOpeningFee);

  // Worker opening creation
  openingId = await apiWrapper.getNextOpeningId();
  const activateAtBlock: BN | undefined = activationDelay.eqn(0)
    ? undefined
    : (await apiWrapper.getBestBlock()).add(activationDelay);
  await apiWrapper.addOpening(
    activateAtBlock,
    lead,
    new BN(membersKeyPairs.length),
    new BN(32),
    new BN(applicationStake),
    new BN(0),
    new BN(0),
    new BN(roleStake),
    new BN(0),
    new BN(0),
    new BN(1),
    new BN(100),
    new BN(1),
    new BN(1),
    new BN(1),
    new BN(1),
    new BN(1),
    new BN(1),
    new BN(1),
    uuid().substring(0, 8),
    'Worker'
  );

  return openingId;
}

export async function addLeaderOpening(
  apiWrapper: ApiWrapper,
  membersKeyPairs: KeyringPair[],
  sudo: KeyringPair,
  applicationStake: BN,
  roleStake: BN,
  activationDelay: BN
): Promise<BN> {
  let openingId: BN;

  // Leader opening creation
  openingId = await apiWrapper.getNextOpeningId();
  const activateAtBlock: BN | undefined = activationDelay.eqn(0)
    ? undefined
    : (await apiWrapper.getBestBlock()).add(activationDelay);
  await apiWrapper.sudoAddOpening(
    activateAtBlock,
    sudo,
    new BN(membersKeyPairs.length),
    new BN(32),
    new BN(applicationStake),
    new BN(0),
    new BN(0),
    new BN(roleStake),
    new BN(0),
    new BN(0),
    new BN(1),
    new BN(100),
    new BN(1),
    new BN(1),
    new BN(1),
    new BN(1),
    new BN(1),
    new BN(1),
    new BN(1),
    uuid().substring(0, 8),
    'Leader'
  );

  return openingId;
}

export async function acceptApplications(apiWrapper: ApiWrapper, lead: KeyringPair, sudo: KeyringPair, openingId: BN) {
  // Fee estimation and transfer
  const acceptApplicationsFee = apiWrapper.estimateAcceptApplicationsFee();
  await apiWrapper.transferBalance(sudo, lead.address, acceptApplicationsFee);

  // Begin accepting applications
  await apiWrapper.acceptApplications(lead, openingId);
}

export async function applyForOpening(
  apiWrapper: ApiWrapper,
  membersKeyPairs: KeyringPair[],
  sudo: KeyringPair,
  applicationStake: BN,
  roleStake: BN,
  openingId: BN,
  expectFailure: boolean
): Promise<BN> {
  let nextApplicationId: BN;

  // Fee estimation and transfer
  const applyOnOpeningFee: BN = apiWrapper.estimateApplyOnOpeningFee(sudo).add(applicationStake).add(roleStake);
  await apiWrapper.transferBalanceToAccounts(sudo, membersKeyPairs, applyOnOpeningFee);

  // Applying for created worker opening
  nextApplicationId = await apiWrapper.getNextApplicationId();
  await apiWrapper.batchApplyOnOpening(
    membersKeyPairs,
    openingId,
    roleStake,
    applicationStake,
    uuid().substring(0, 8),
    expectFailure
  );

  return nextApplicationId;
}

export async function withdrawApplicaiton(apiWrapper: ApiWrapper, membersKeyPairs: KeyringPair[], sudo: KeyringPair) {
  // Fee estimation and transfer
  const withdrawApplicaitonFee: BN = apiWrapper.estimateWithdrawApplicationFee();
  await apiWrapper.transferBalanceToAccounts(sudo, membersKeyPairs, withdrawApplicaitonFee);

  // Application withdrawal
  await apiWrapper.batchWithdrawApplication(membersKeyPairs);

  // Assertions
  membersKeyPairs.forEach(async keyPair => {
    const activeApplications: BN[] = await apiWrapper.getActiveApplicationsIdsByRoleAccount(keyPair.address);
    assert(activeApplications.length === 0, `Unexpected active application found for ${keyPair.address}`);
  });
}

export async function beginApplicationReview(
  apiWrapper: ApiWrapper,
  lead: KeyringPair,
  sudo: KeyringPair,
  openingId: BN
) {
  // Fee estimation and transfer
  const beginReviewFee: BN = apiWrapper.estimateBeginApplicantReviewFee();
  await apiWrapper.transferBalance(sudo, lead.address, beginReviewFee);

  // Begin application review
  await apiWrapper.beginApplicantReview(lead, openingId);
}

export async function beginLeaderApplicationReview(apiWrapper: ApiWrapper, sudo: KeyringPair, openingId: BN) {
  // Begin application review
  await apiWrapper.sudoBeginApplicantReview(sudo, openingId);
}

export async function fillOpening(
  apiWrapper: ApiWrapper,
  membersKeyPairs: KeyringPair[],
  lead: KeyringPair,
  sudo: KeyringPair,
  openingId: BN
) {
  // Fee estimation and transfer
  const beginReviewFee: BN = apiWrapper.estimateBeginApplicantReviewFee();
  await apiWrapper.transferBalance(sudo, lead.address, beginReviewFee);
  const applicationIds: BN[] = (
    await Promise.all(
      membersKeyPairs.map(async keypair => apiWrapper.getActiveApplicationsIdsByRoleAccount(keypair.address))
    )
  ).flat();

  // Fill worker opening
  await apiWrapper.fillOpening(lead, openingId, applicationIds, new BN(1), new BN(99999999), new BN(99999999));

  // Assertions
  const openingWorkersAccounts: string[] = (await apiWrapper.getWorkers()).map(worker =>
    worker.role_account_id.toString()
  );
  membersKeyPairs.forEach(keyPair =>
    assert(openingWorkersAccounts.includes(keyPair.address), `Account ${keyPair.address} is not worker`)
  );
}

export async function fillLeaderOpening(
  apiWrapper: ApiWrapper,
  membersKeyPairs: KeyringPair[],
  sudo: KeyringPair,
  openingId: BN
) {
  const applicationIds: BN[] = (
    await Promise.all(
      membersKeyPairs.map(async keypair => apiWrapper.getActiveApplicationsIdsByRoleAccount(keypair.address))
    )
  ).flat();

  // Fill worker opening
  await apiWrapper.sudoFillOpening(sudo, openingId, applicationIds, new BN(1), new BN(99999999), new BN(99999999));

  // Assertions
  const openingWorkersAccounts: string[] = (await apiWrapper.getWorkers()).map(worker =>
    worker.role_account_id.toString()
  );
  membersKeyPairs.forEach(keyPair =>
    assert(openingWorkersAccounts.includes(keyPair.address), `Account ${keyPair.address} is not leader`)
  );
}

export async function increaseStake(apiWrapper: ApiWrapper, membersKeyPairs: KeyringPair[], sudo: KeyringPair) {
  // Fee estimation and transfer
  const increaseStakeFee: BN = apiWrapper.estimateIncreaseStakeFee();
  const stakeIncrement: BN = new BN(1);
  await apiWrapper.transferBalance(sudo, membersKeyPairs[0].address, increaseStakeFee.add(stakeIncrement));
  const workerId: BN = await apiWrapper.getWorkerIdByRoleAccount(membersKeyPairs[0].address);

  // Increase worker stake
  const increasedWorkerStake: BN = (await apiWrapper.getWorkerStakeAmount(workerId)).add(stakeIncrement);
  await apiWrapper.increaseStake(membersKeyPairs[0], workerId, stakeIncrement);
  const newWorkerStake: BN = await apiWrapper.getWorkerStakeAmount(workerId);
  assert(
    increasedWorkerStake.eq(newWorkerStake),
    `Unexpected worker stake ${newWorkerStake}, expected ${increasedWorkerStake}`
  );
}

export async function updateRewardAccount(
  apiWrapper: ApiWrapper,
  membersKeyPairs: KeyringPair[],
  keyring: Keyring,
  sudo: KeyringPair
) {
  // Fee estimation and transfer
  const updateRewardAccountFee: BN = apiWrapper.estimateUpdateRewardAccountFee(sudo.address);
  await apiWrapper.transferBalance(sudo, membersKeyPairs[0].address, updateRewardAccountFee);
  const workerId: BN = await apiWrapper.getWorkerIdByRoleAccount(membersKeyPairs[0].address);

  // Update reward account
  const createdAccount: KeyringPair = keyring.addFromUri(uuid().substring(0, 8));
  await apiWrapper.updateRewardAccount(membersKeyPairs[0], workerId, createdAccount.address);
  const newRewardAccount: string = await apiWrapper.getWorkerRewardAccount(workerId);
  assert(
    newRewardAccount === createdAccount.address,
    `Unexpected role account ${newRewardAccount}, expected ${createdAccount.address}`
  );
}

export async function updateRoleAccount(
  apiWrapper: ApiWrapper,
  membersKeyPairs: KeyringPair[],
  keyring: Keyring,
  sudo: KeyringPair
) {
  // Fee estimation and transfer
  const updateRoleAccountFee: BN = apiWrapper.estimateUpdateRoleAccountFee(sudo.address);
  await apiWrapper.transferBalance(sudo, membersKeyPairs[0].address, updateRoleAccountFee);
  const workerId: BN = await apiWrapper.getWorkerIdByRoleAccount(membersKeyPairs[0].address);

  // Update role account
  const createdAccount: KeyringPair = keyring.addFromUri(uuid().substring(0, 8));
  await apiWrapper.updateRoleAccount(membersKeyPairs[0], workerId, createdAccount.address);
  const newRoleAccount: string = (await apiWrapper.getWorker(workerId)).role_account_id.toString();
  assert(
    newRoleAccount === createdAccount.address,
    `Unexpected role account ${newRoleAccount}, expected ${createdAccount.address}`
  );

  membersKeyPairs[0] = createdAccount;
}

export async function terminateApplications(
  apiWrapper: ApiWrapper,
  membersKeyPairs: KeyringPair[],
  lead: KeyringPair,
  sudo: KeyringPair
) {
  // Fee estimation and transfer
  const terminateApplicationFee = apiWrapper.estimateTerminateApplicationFee();
  await apiWrapper.transferBalance(sudo, lead.address, terminateApplicationFee.muln(membersKeyPairs.length));

  // Terminate worker applications
  await apiWrapper.batchTerminateApplication(lead, membersKeyPairs);
}

export async function decreaseStake(
  apiWrapper: ApiWrapper,
  membersKeyPairs: KeyringPair[],
  lead: KeyringPair,
  sudo: KeyringPair,
  expectFailure: boolean
) {
  // Fee estimation and transfer
  const decreaseStakeFee = apiWrapper.estimateDecreaseStakeFee();
  await apiWrapper.transferBalance(sudo, lead.address, decreaseStakeFee);
  const workerStakeDecrement = new BN(1);
  const workerId: BN = await apiWrapper.getWorkerIdByRoleAccount(membersKeyPairs[0].address);

  // Worker stake decrement
  const decreasedWorkerStake: BN = (await apiWrapper.getWorkerStakeAmount(workerId)).sub(workerStakeDecrement);
  await apiWrapper.decreaseStake(lead, workerId, workerStakeDecrement, expectFailure);
  const newWorkerStake: BN = await apiWrapper.getWorkerStakeAmount(workerId);

  // Assertions
  if (!expectFailure) {
    assert(
      decreasedWorkerStake.eq(newWorkerStake),
      `Unexpected worker stake ${newWorkerStake}, expected ${decreasedWorkerStake}`
    );
  }
}

export async function slash(
  apiWrapper: ApiWrapper,
  membersKeyPairs: KeyringPair[],
  lead: KeyringPair,
  sudo: KeyringPair,
  expectFailure: boolean
) {
  // Fee estimation and transfer
  const slashStakeFee = apiWrapper.estimateSlashStakeFee();
  await apiWrapper.transferBalance(sudo, lead.address, slashStakeFee);
  const slashAmount = new BN(1);
  const workerId: BN = await apiWrapper.getWorkerIdByRoleAccount(membersKeyPairs[0].address);

  // Slash worker
  const slashedStake: BN = (await apiWrapper.getWorkerStakeAmount(workerId)).sub(slashAmount);
  await apiWrapper.slashStake(lead, workerId, slashAmount, expectFailure);
  const newStake: BN = await apiWrapper.getWorkerStakeAmount(workerId);

  // Assertions
  assert(slashedStake.eq(newStake), `Unexpected worker stake ${newStake}, expected ${slashedStake}`);
}

export async function terminateRole(
  apiWrapper: ApiWrapper,
  membersKeyPairs: KeyringPair[],
  lead: KeyringPair,
  sudo: KeyringPair,
  expectFailure: boolean
) {
  // Fee estimation and transfer
  const terminateRoleFee = apiWrapper.estimateTerminateRoleFee();
  await apiWrapper.transferBalance(sudo, lead.address, terminateRoleFee);
  const workerId: BN = await apiWrapper.getWorkerIdByRoleAccount(membersKeyPairs[0].address);

  // Slash worker
  await apiWrapper.terminateRole(lead, workerId, uuid().substring(0, 8), expectFailure);

  // Assertions
  apiWrapper.getWorkerIdByRoleAccount(membersKeyPairs[0].address);
  const newWorkerId = await apiWrapper.getWorkerIdByRoleAccount(membersKeyPairs[0].address);
  assert(newWorkerId === undefined, `Worker with account ${membersKeyPairs[0].address} is not terminated`);
}

export async function leaveRole(apiWrapper: ApiWrapper, membersKeyPairs: KeyringPair[], sudo: KeyringPair) {
  // Fee estimation and transfer
  const leaveRoleFee = apiWrapper.estimateLeaveRoleFee();
  await apiWrapper.transferBalanceToAccounts(sudo, membersKeyPairs, leaveRoleFee);

  await apiWrapper.batchLeaveRole(membersKeyPairs, uuid().substring(0, 8), false);
}
