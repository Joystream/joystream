import BN from 'bn.js';
import { assert } from 'chai';
import { ApiWrapper } from '../../../utils/apiWrapper';
import { KeyringPair } from '@polkadot/keyring/types';
import { WorkerOpening } from '@nicaea/types/lib/bureaucracy';
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
  let workerOpeningId: BN;

  // Fee estimation and transfer
  const addWorkerOpeningFee: BN = apiWrapper.estimateAddWorkerOpeningFee();
  await apiWrapper.transferBalance(sudo, lead.address, addWorkerOpeningFee);

  // Worker opening creation
  workerOpeningId = await apiWrapper.getNextWorkerOpeningId();
  const activateAtBlock: BN | undefined = activationDelay.eqn(0)
    ? undefined
    : (await apiWrapper.getBestBlock()).add(activationDelay);
  await apiWrapper.addWorkerOpening(
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
    ''
  );

  return workerOpeningId;
}

export async function acceptWorkerApplications(
  apiWrapper: ApiWrapper,
  lead: KeyringPair,
  sudo: KeyringPair,
  workerOpeningId: BN
) {
  // Fee estimation and transfer
  const acceptWorkerApplicationsFee = apiWrapper.estimateAcceptWorkerApplicationsFee();
  await apiWrapper.transferBalance(sudo, lead.address, acceptWorkerApplicationsFee);

  // Begin accepting applications
  await apiWrapper.acceptWorkerApplications(lead, workerOpeningId);
}

export async function applyForWorkerOpening(
  apiWrapper: ApiWrapper,
  membersKeyPairs: KeyringPair[],
  sudo: KeyringPair,
  applicationStake: BN,
  roleStake: BN,
  workerOpeningId: BN,
  expectFailure: boolean
): Promise<BN> {
  let nextApplicationId: BN;

  // Fee estimation and transfer
  const applyOnOpeningFee: BN = apiWrapper.estimateApplyOnOpeningFee(sudo).add(applicationStake).add(roleStake);
  await apiWrapper.transferBalanceToAccounts(sudo, membersKeyPairs, applyOnOpeningFee);

  // Applying for created worker opening
  nextApplicationId = await apiWrapper.getNextApplicationId();
  await apiWrapper.batchApplyOnWorkerOpening(
    membersKeyPairs,
    workerOpeningId,
    roleStake,
    applicationStake,
    '',
    expectFailure
  );

  return nextApplicationId;
}

export async function withdrawWorkerApplicaiton(
  apiWrapper: ApiWrapper,
  membersKeyPairs: KeyringPair[],
  sudo: KeyringPair
) {
  // Fee estimation and transfer
  const withdrawApplicaitonFee: BN = apiWrapper.estimateWithdrawWorkerApplicationFee();
  await apiWrapper.transferBalanceToAccounts(sudo, membersKeyPairs, withdrawApplicaitonFee);

  // Application withdrawal
  await apiWrapper.batchWithdrawWorkerApplication(membersKeyPairs);

  // Assertions
  membersKeyPairs.forEach(async keyPair => {
    const activeApplications: BN[] = await apiWrapper.getActiveWorkerApplicationsIdsByRoleAccount(keyPair.address);
    assert(activeApplications.length === 0, `Unexpected active application found for ${keyPair.address}`);
  });
}

export async function beginApplicationReview(
  apiWrapper: ApiWrapper,
  lead: KeyringPair,
  sudo: KeyringPair,
  workerOpeningId: BN
) {
  // Fee estimation and transfer
  const beginReviewFee: BN = apiWrapper.estimateBeginWorkerApplicantReviewFee();
  await apiWrapper.transferBalance(sudo, lead.address, beginReviewFee);

  // Begin application review
  await apiWrapper.beginWorkerApplicationReview(lead, workerOpeningId);
}

export async function fillWorkerOpening(
  apiWrapper: ApiWrapper,
  membersKeyPairs: KeyringPair[],
  lead: KeyringPair,
  sudo: KeyringPair,
  workerOpeningId: BN
) {
  // Fee estimation and transfer
  const beginReviewFee: BN = apiWrapper.estimateBeginWorkerApplicantReviewFee();
  await apiWrapper.transferBalance(sudo, lead.address, beginReviewFee);
  const applicationIds: BN[] = await Promise.all(
    membersKeyPairs.map(async keypair => apiWrapper.getActiveWorkerApplicationsIdsByRoleAccount(keypair.address)).flat()
  );

  // Fill worker opening
  await apiWrapper.fillWorkerOpening(
    lead,
    workerOpeningId,
    applicationIds,
    new BN(1),
    new BN(99999999),
    new BN(99999999)
  );

  // Assertions
  const workerOpening: WorkerOpening = await apiWrapper.getWorkerOpening(workerOpeningId);
  const openingWorkersAccounts: string[] = (await apiWrapper.getWorkers()).map(worker =>
    worker.role_account.toString()
  );
  membersKeyPairs.forEach(keyPair =>
    assert(openingWorkersAccounts.includes(keyPair.address), `Account ${keyPair.address} is not worker`)
  );
}

export async function increaseWorkerStake(apiWrapper: ApiWrapper, membersKeyPairs: KeyringPair[], sudo: KeyringPair) {
  // Fee estimation and transfer
  const increaseStakeFee: BN = apiWrapper.estimateIncreaseWorkerStakeFee();
  const stakeIncrement: BN = new BN(1);
  await apiWrapper.transferBalance(sudo, membersKeyPairs[0].address, increaseStakeFee.add(stakeIncrement));
  const workerId: BN = await apiWrapper.getWorkerIdByRoleAccount(membersKeyPairs[0].address);

  // Increase worker stake
  const increasedWorkerStake: BN = (await apiWrapper.getWorkerStakeAmount(workerId)).add(stakeIncrement);
  await apiWrapper.increaseWorkerStake(membersKeyPairs[0], workerId, stakeIncrement);
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
  const newRoleAccount: string = (await apiWrapper.getWorker(workerId)).role_account.toString();
  assert(
    newRoleAccount === createdAccount.address,
    `Unexpected role account ${newRoleAccount}, expected ${createdAccount.address}`
  );

  membersKeyPairs[0] = createdAccount;
}

export async function terminateWorkerApplications(
  apiWrapper: ApiWrapper,
  membersKeyPairs: KeyringPair[],
  lead: KeyringPair,
  sudo: KeyringPair
) {
  // Fee estimation and transfer
  const terminateWorkerApplicationFee = apiWrapper.estimateTerminateWorkerApplicationFee();
  await apiWrapper.transferBalance(sudo, lead.address, terminateWorkerApplicationFee.muln(membersKeyPairs.length));

  // Terminate worker applications
  await apiWrapper.batchTerminateWorkerApplication(lead, membersKeyPairs);
}

export async function decreaseWorkerStake(
  apiWrapper: ApiWrapper,
  membersKeyPairs: KeyringPair[],
  lead: KeyringPair,
  sudo: KeyringPair,
  expectFailure: boolean
) {
  // Fee estimation and transfer
  const decreaseWorkerStakeFee = apiWrapper.estimateDecreaseWorkerStakeFee();
  await apiWrapper.transferBalance(sudo, lead.address, decreaseWorkerStakeFee);
  const workerStakeDecrement = new BN(1);
  const workerId: BN = await apiWrapper.getWorkerIdByRoleAccount(membersKeyPairs[0].address);

  // Worker stake decrement
  const decreasedWorkerStake: BN = (await apiWrapper.getWorkerStakeAmount(workerId)).sub(workerStakeDecrement);
  await apiWrapper.decreaseWorkerStake(lead, workerId, workerStakeDecrement, expectFailure);
  const newWorkerStake: BN = await apiWrapper.getWorkerStakeAmount(workerId);

  // Assertions
  if (!expectFailure) {
    assert(
      decreasedWorkerStake.eq(newWorkerStake),
      `Unexpected worker stake ${newWorkerStake}, expected ${decreasedWorkerStake}`
    );
  }
}

export async function slashWorker(
  apiWrapper: ApiWrapper,
  membersKeyPairs: KeyringPair[],
  lead: KeyringPair,
  sudo: KeyringPair,
  expectFailure: boolean
) {
  // Fee estimation and transfer
  const slashWorkerStakeFee = apiWrapper.estimateSlashWorkerStakeFee();
  await apiWrapper.transferBalance(sudo, lead.address, slashWorkerStakeFee);
  const slashAmount = new BN(1);
  const workerId: BN = await apiWrapper.getWorkerIdByRoleAccount(membersKeyPairs[0].address);

  // Slash worker
  const slashedWorkerStake: BN = (await apiWrapper.getWorkerStakeAmount(workerId)).sub(slashAmount);
  await apiWrapper.slashWorkerStake(lead, workerId, slashAmount, expectFailure);
  const newWorkerStake: BN = await apiWrapper.getWorkerStakeAmount(workerId);

  // Assertions
  assert(
    slashedWorkerStake.eq(newWorkerStake),
    `Unexpected worker stake ${newWorkerStake}, expected ${slashedWorkerStake}`
  );
}

export async function terminateWorkerRole(
  apiWrapper: ApiWrapper,
  membersKeyPairs: KeyringPair[],
  lead: KeyringPair,
  sudo: KeyringPair,
  expectFailure: boolean
) {
  // Fee estimation and transfer
  const terminateWorkerRoleFee = apiWrapper.estimateTerminateWorkerRoleFee();
  await apiWrapper.transferBalance(sudo, lead.address, terminateWorkerRoleFee);
  const workerId: BN = await apiWrapper.getWorkerIdByRoleAccount(membersKeyPairs[0].address);

  // Slash worker
  await apiWrapper.terminateWorkerRole(lead, workerId, '', expectFailure);

  // Assertions
  apiWrapper.getWorkerIdByRoleAccount(membersKeyPairs[0].address);
  const newWorkerId = await apiWrapper.getWorkerIdByRoleAccount(membersKeyPairs[0].address);
  assert(newWorkerId === undefined, `Worker with account ${membersKeyPairs[0].address} is not terminated`);
}
