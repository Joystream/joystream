import BN from 'bn.js';
import { assert } from 'chai';
import { ApiWrapper, WorkingGroups } from '../../../utils/apiWrapper';
import { KeyringPair } from '@polkadot/keyring/types';
import { Keyring } from '@polkadot/api';
import { v4 as uuid } from 'uuid';
import { RewardRelationship } from '@nicaea/types/recurring-rewards';
import { Worker, ApplicationIdToWorkerIdMap, Application } from '@nicaea/types/working-group';
import { Utils } from '../../../utils/utils';
import { Opening as HiringOpening } from '@nicaea/types/hiring';
import { WorkingGroupOpening } from '../../../dto/workingGroupOpening';

export async function addWorkerOpening(
  apiWrapper: ApiWrapper,
  membersKeyPairs: KeyringPair[],
  lead: KeyringPair,
  sudo: KeyringPair,
  applicationStake: BN,
  roleStake: BN,
  activationDelay: BN,
  module: WorkingGroups
): Promise<BN> {
  // Worker opening construction
  let opening = new WorkingGroupOpening();
  const activateAtBlock: BN | undefined = activationDelay.eqn(0)
    ? undefined
    : (await apiWrapper.getBestBlock()).add(activationDelay);
  opening.setActivateAtBlock(activateAtBlock);
  opening.setMaxActiveApplicants(new BN(membersKeyPairs.length));
  opening.setMaxReviewPeriodLength(new BN(32));
  opening.setApplicationStakingPolicyAmount(new BN(applicationStake));
  opening.setApplicationCrowdedOutUnstakingPeriodLength(new BN(0));
  opening.setApplicationExpiredUnstakingPeriodLength(new BN(0));
  opening.setRoleStakingPolicyAmount(new BN(roleStake));
  opening.setRoleCrowdedOutUnstakingPeriodLength(new BN(0));
  opening.setRoleExpiredUnstakingPeriodLength(new BN(0));
  opening.setSlashableMaxCount(new BN(1));
  opening.setSlashableMaxPercentPtsPerTime(new BN(100));
  opening.setSuccessfulApplicantApplicationStakeUnstakingPeriod(new BN(1));
  opening.setFailedApplicantApplicationStakeUnstakingPeriod(new BN(1));
  opening.setFailedApplicantRoleStakeUnstakingPeriod(new BN(1));
  opening.setTerminateCuratorApplicationStakeUnstakingPeriod(new BN(1));
  opening.setTerminateCuratorRoleStakeUnstakingPeriod(new BN(1));
  opening.setExitCuratorRoleApplicationStakeUnstakingPeriod(new BN(1));
  opening.setExitCuratorRoleStakeUnstakingPeriod(new BN(1));
  opening.setText(uuid().substring(0, 8));
  opening.setOpeningType('Worker');

  // Fee estimation and transfer
  const addOpeningFee: BN = apiWrapper.estimateAddOpeningFee(opening, module);
  await apiWrapper.transferBalance(sudo, lead.address, addOpeningFee);

  // Worker opening creation
  const addOpeningPromise: Promise<BN> = apiWrapper.expectOpeningAdded();
  await apiWrapper.addOpening(lead, opening, module);
  const openingId: BN = await addOpeningPromise;

  return openingId;
}

export async function addLeaderOpening(
  apiWrapper: ApiWrapper,
  membersKeyPairs: KeyringPair[],
  sudo: KeyringPair,
  applicationStake: BN,
  roleStake: BN,
  activationDelay: BN,
  module: WorkingGroups
): Promise<BN> {
  // Leader opening creation
  const activateAtBlock: BN | undefined = activationDelay.eqn(0)
    ? undefined
    : (await apiWrapper.getBestBlock()).add(activationDelay);
  let opening = new WorkingGroupOpening();
  opening.setActivateAtBlock(activateAtBlock);
  opening.setMaxActiveApplicants(new BN(membersKeyPairs.length));
  opening.setMaxReviewPeriodLength(new BN(32));
  opening.setApplicationStakingPolicyAmount(new BN(applicationStake));
  opening.setApplicationCrowdedOutUnstakingPeriodLength(new BN(0));
  opening.setApplicationExpiredUnstakingPeriodLength(new BN(0));
  opening.setRoleStakingPolicyAmount(new BN(roleStake));
  opening.setRoleCrowdedOutUnstakingPeriodLength(new BN(0));
  opening.setRoleExpiredUnstakingPeriodLength(new BN(0));
  opening.setSlashableMaxCount(new BN(1));
  opening.setSlashableMaxPercentPtsPerTime(new BN(100));
  opening.setSuccessfulApplicantApplicationStakeUnstakingPeriod(new BN(1));
  opening.setFailedApplicantApplicationStakeUnstakingPeriod(new BN(1));
  opening.setFailedApplicantRoleStakeUnstakingPeriod(new BN(1));
  opening.setTerminateCuratorApplicationStakeUnstakingPeriod(new BN(1));
  opening.setTerminateCuratorRoleStakeUnstakingPeriod(new BN(1));
  opening.setExitCuratorRoleApplicationStakeUnstakingPeriod(new BN(1));
  opening.setExitCuratorRoleStakeUnstakingPeriod(new BN(1));
  opening.setText(uuid().substring(0, 8));
  opening.setOpeningType('leader');

  const addOpeningPromise: Promise<BN> = apiWrapper.expectOpeningAdded();
  await apiWrapper.sudoAddOpening(sudo, opening, module);
  const openingId: BN = await addOpeningPromise;

  return openingId;
}

export async function acceptApplications(
  apiWrapper: ApiWrapper,
  lead: KeyringPair,
  sudo: KeyringPair,
  openingId: BN,
  module: WorkingGroups
) {
  // Fee estimation and transfer
  const acceptApplicationsFee = apiWrapper.estimateAcceptApplicationsFee(module);
  await apiWrapper.transferBalance(sudo, lead.address, acceptApplicationsFee);

  // Begin accepting applications
  await apiWrapper.acceptApplications(lead, openingId, module);

  const opening: HiringOpening = await apiWrapper.getHiringOpening(openingId);
  assert(opening.is_active, `Opening ${openingId} is not active`);
}

export async function applyForOpening(
  apiWrapper: ApiWrapper,
  membersKeyPairs: KeyringPair[],
  sudo: KeyringPair,
  applicationStake: BN,
  roleStake: BN,
  openingId: BN,
  module: WorkingGroups,
  expectFailure: boolean
): Promise<void> {
  // Fee estimation and transfer
  const applyOnOpeningFee: BN = apiWrapper.estimateApplyOnOpeningFee(sudo, module).add(applicationStake).add(roleStake);
  await apiWrapper.transferBalanceToAccounts(sudo, membersKeyPairs, applyOnOpeningFee);

  // Applying for created worker opening
  await apiWrapper.batchApplyOnOpening(
    membersKeyPairs,
    openingId,
    roleStake,
    applicationStake,
    uuid().substring(0, 8),
    module,
    expectFailure
  );
}

export async function withdrawApplicaiton(
  apiWrapper: ApiWrapper,
  membersKeyPairs: KeyringPair[],
  sudo: KeyringPair,
  module: WorkingGroups
) {
  // Fee estimation and transfer
  const withdrawApplicaitonFee: BN = apiWrapper.estimateWithdrawApplicationFee(module);
  await apiWrapper.transferBalanceToAccounts(sudo, membersKeyPairs, withdrawApplicaitonFee);

  // Application withdrawal
  await apiWrapper.batchWithdrawApplication(membersKeyPairs, module);

  // Assertions
  membersKeyPairs.forEach(async keyPair => {
    const activeApplications: BN[] = await apiWrapper.getActiveApplicationsIdsByRoleAccount(keyPair.address, module);
    assert(activeApplications.length === 0, `Unexpected active application found for ${keyPair.address}`);
  });
}

export async function beginApplicationReview(
  apiWrapper: ApiWrapper,
  lead: KeyringPair,
  sudo: KeyringPair,
  openingId: BN,
  module: WorkingGroups
) {
  // Fee estimation and transfer
  const beginReviewFee: BN = apiWrapper.estimateBeginApplicantReviewFee(module);
  await apiWrapper.transferBalance(sudo, lead.address, beginReviewFee);

  // Begin application review
  const beginApplicantReviewPromise: Promise<void> = apiWrapper.expectApplicationReviewBegan();
  await apiWrapper.beginApplicantReview(lead, openingId, module);
  await beginApplicantReviewPromise;
}

export async function beginLeaderApplicationReview(
  apiWrapper: ApiWrapper,
  sudo: KeyringPair,
  openingId: BN,
  module: WorkingGroups
) {
  // Begin application review
  await apiWrapper.sudoBeginApplicantReview(sudo, openingId, module);
}

export async function fillOpening(
  apiWrapper: ApiWrapper,
  membersKeyPairs: KeyringPair[],
  lead: KeyringPair,
  sudo: KeyringPair,
  openingId: BN,
  firstPayoutInterval: BN,
  payoutInterval: BN,
  amountPerPayout: BN,
  module: WorkingGroups
) {
  // Fee estimation and transfer
  const beginReviewFee: BN = apiWrapper.estimateBeginApplicantReviewFee(module);
  await apiWrapper.transferBalance(sudo, lead.address, beginReviewFee);
  const applicationIds: BN[] = (
    await Promise.all(
      membersKeyPairs.map(async keypair => apiWrapper.getActiveApplicationsIdsByRoleAccount(keypair.address, module))
    )
  ).flat();

  // Fill worker opening
  const now: BN = await apiWrapper.getBestBlock();
  const fillOpeningPromise: Promise<ApplicationIdToWorkerIdMap> = apiWrapper.expectOpeningFilled();
  await apiWrapper.fillOpening(
    lead,
    openingId,
    applicationIds,
    amountPerPayout,
    now.add(firstPayoutInterval),
    payoutInterval,
    module
  );
  const applicationIdToWorkerIdMap: ApplicationIdToWorkerIdMap = await fillOpeningPromise;
  applicationIdToWorkerIdMap.forEach(async (workerId, applicationId) => {
    const worker: Worker = await apiWrapper.getWorkerById(workerId, module);
    const application: Application = await apiWrapper.getApplicationById(applicationId, module);
    assert(
      worker.role_account_id.toString() === application.role_account_id.toString(),
      `Role account ids does not match, worker account: ${worker.role_account_id}, application account ${application.role_account_id}`
    );
  });

  // Assertions
  const openingWorkersAccounts: string[] = (await apiWrapper.getWorkers(module)).map(worker =>
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
  openingId: BN,
  firstPayoutInterval: BN,
  payoutInterval: BN,
  amountPerPayout: BN,
  module: WorkingGroups
) {
  const applicationIds: BN[] = (
    await Promise.all(
      membersKeyPairs.map(async keypair => apiWrapper.getActiveApplicationsIdsByRoleAccount(keypair.address, module))
    )
  ).flat();

  // Fill leader opening
  const now: BN = await apiWrapper.getBestBlock();
  const fillOpeningPromise: Promise<ApplicationIdToWorkerIdMap> = apiWrapper.expectOpeningFilled();
  await apiWrapper.sudoFillOpening(
    sudo,
    openingId,
    applicationIds,
    amountPerPayout,
    now.add(firstPayoutInterval),
    payoutInterval,
    module
  );
  const applicationIdToWorkerIdMap: ApplicationIdToWorkerIdMap = await fillOpeningPromise;
  applicationIdToWorkerIdMap.forEach(async (workerId, applicationId) => {
    const worker: Worker = await apiWrapper.getWorkerById(workerId, module);
    const application: Application = await apiWrapper.getApplicationById(applicationId, module);
    assert(
      worker.role_account_id.toString() === application.role_account_id.toString(),
      `Role account ids does not match, worker account: ${worker.role_account_id}, application account ${application.role_account_id}`
    );
  });

  // Assertions
  const openingWorkersAccounts: string[] = (await apiWrapper.getWorkers(module)).map(worker =>
    worker.role_account_id.toString()
  );
  membersKeyPairs.forEach(keyPair =>
    assert(openingWorkersAccounts.includes(keyPair.address), `Account ${keyPair.address} is not leader`)
  );
}

export async function increaseStake(
  apiWrapper: ApiWrapper,
  membersKeyPairs: KeyringPair[],
  sudo: KeyringPair,
  module: WorkingGroups
) {
  // Fee estimation and transfer
  const increaseStakeFee: BN = apiWrapper.estimateIncreaseStakeFee(module);
  const stakeIncrement: BN = new BN(1);
  await apiWrapper.transferBalance(sudo, membersKeyPairs[0].address, increaseStakeFee.add(stakeIncrement));
  const workerId: BN = await apiWrapper.getWorkerIdByRoleAccount(membersKeyPairs[0].address, module);

  // Increase worker stake
  const increasedWorkerStake: BN = (await apiWrapper.getWorkerStakeAmount(workerId, module)).add(stakeIncrement);
  await apiWrapper.increaseStake(membersKeyPairs[0], workerId, stakeIncrement, module);
  const newWorkerStake: BN = await apiWrapper.getWorkerStakeAmount(workerId, module);
  assert(
    increasedWorkerStake.eq(newWorkerStake),
    `Unexpected worker stake ${newWorkerStake}, expected ${increasedWorkerStake}`
  );
}

export async function updateRewardAccount(
  apiWrapper: ApiWrapper,
  membersKeyPairs: KeyringPair[],
  keyring: Keyring,
  sudo: KeyringPair,
  module: WorkingGroups
) {
  // Fee estimation and transfer
  const updateRewardAccountFee: BN = apiWrapper.estimateUpdateRewardAccountFee(sudo.address, module);
  await apiWrapper.transferBalance(sudo, membersKeyPairs[0].address, updateRewardAccountFee);
  const workerId: BN = await apiWrapper.getWorkerIdByRoleAccount(membersKeyPairs[0].address, module);

  // Update reward account
  const createdAccount: KeyringPair = keyring.addFromUri(uuid().substring(0, 8));
  await apiWrapper.updateRewardAccount(membersKeyPairs[0], workerId, createdAccount.address, module);
  const newRewardAccount: string = await apiWrapper.getWorkerRewardAccount(workerId, module);
  assert(
    newRewardAccount === createdAccount.address,
    `Unexpected role account ${newRewardAccount}, expected ${createdAccount.address}`
  );
}

export async function updateRoleAccount(
  apiWrapper: ApiWrapper,
  membersKeyPairs: KeyringPair[],
  keyring: Keyring,
  sudo: KeyringPair,
  module: WorkingGroups
) {
  // Fee estimation and transfer
  const updateRoleAccountFee: BN = apiWrapper.estimateUpdateRoleAccountFee(sudo.address, module);
  await apiWrapper.transferBalance(sudo, membersKeyPairs[0].address, updateRoleAccountFee);
  const workerId: BN = await apiWrapper.getWorkerIdByRoleAccount(membersKeyPairs[0].address, module);

  // Update role account
  const createdAccount: KeyringPair = keyring.addFromUri(uuid().substring(0, 8));
  await apiWrapper.updateRoleAccount(membersKeyPairs[0], workerId, createdAccount.address, module);
  const newRoleAccount: string = (await apiWrapper.getWorkerById(workerId, module)).role_account_id.toString();
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
  sudo: KeyringPair,
  module: WorkingGroups
) {
  // Fee estimation and transfer
  const terminateApplicationFee = apiWrapper.estimateTerminateApplicationFee(module);
  await apiWrapper.transferBalance(sudo, lead.address, terminateApplicationFee.muln(membersKeyPairs.length));

  // Terminate worker applications
  await apiWrapper.batchTerminateApplication(lead, membersKeyPairs, module);
  membersKeyPairs.forEach(async keyPair => {
    const activeApplications = await apiWrapper.getActiveApplicationsIdsByRoleAccount(keyPair.address, module);
    assert(activeApplications.length === 0, `Account ${keyPair.address} has unexpected active applications`);
  });
}

export async function decreaseStake(
  apiWrapper: ApiWrapper,
  membersKeyPairs: KeyringPair[],
  lead: KeyringPair,
  sudo: KeyringPair,
  module: WorkingGroups,
  expectFailure: boolean
) {
  // Fee estimation and transfer
  const decreaseStakeFee = apiWrapper.estimateDecreaseStakeFee(module);
  await apiWrapper.transferBalance(sudo, lead.address, decreaseStakeFee);
  const workerStakeDecrement = new BN(1);
  const workerId: BN = await apiWrapper.getWorkerIdByRoleAccount(membersKeyPairs[0].address, module);

  // Worker stake decrement
  const decreasedWorkerStake: BN = (await apiWrapper.getWorkerStakeAmount(workerId, module)).sub(workerStakeDecrement);
  await apiWrapper.decreaseStake(lead, workerId, workerStakeDecrement, module, expectFailure);
  const newWorkerStake: BN = await apiWrapper.getWorkerStakeAmount(workerId, module);

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
  module: WorkingGroups,
  expectFailure: boolean
) {
  // Fee estimation and transfer
  const slashStakeFee = apiWrapper.estimateSlashStakeFee(module);
  await apiWrapper.transferBalance(sudo, lead.address, slashStakeFee);
  const slashAmount = new BN(1);
  const workerId: BN = await apiWrapper.getWorkerIdByRoleAccount(membersKeyPairs[0].address, module);

  // Slash worker
  const slashedStake: BN = (await apiWrapper.getWorkerStakeAmount(workerId, module)).sub(slashAmount);
  await apiWrapper.slashStake(lead, workerId, slashAmount, module, expectFailure);
  const newStake: BN = await apiWrapper.getWorkerStakeAmount(workerId, module);

  // Assertions
  assert(slashedStake.eq(newStake), `Unexpected worker stake ${newStake}, expected ${slashedStake}`);
}

export async function terminateRole(
  apiWrapper: ApiWrapper,
  membersKeyPairs: KeyringPair[],
  lead: KeyringPair,
  sudo: KeyringPair,
  module: WorkingGroups,
  expectFailure: boolean
) {
  // Fee estimation and transfer
  const terminateRoleFee = apiWrapper.estimateTerminateRoleFee(module);
  await apiWrapper.transferBalance(sudo, lead.address, terminateRoleFee);
  const workerId: BN = await apiWrapper.getWorkerIdByRoleAccount(membersKeyPairs[0].address, module);

  // Slash worker
  await apiWrapper.terminateRole(lead, workerId, uuid().substring(0, 8), module, expectFailure);

  // Assertions
  apiWrapper.getWorkerIdByRoleAccount(membersKeyPairs[0].address, module);
  const newWorkerId = await apiWrapper.getWorkerIdByRoleAccount(membersKeyPairs[0].address, module);
  assert(newWorkerId === undefined, `Worker with account ${membersKeyPairs[0].address} is not terminated`);
}

export async function leaveRole(
  apiWrapper: ApiWrapper,
  membersKeyPairs: KeyringPair[],
  sudo: KeyringPair,
  module: WorkingGroups
) {
  // Fee estimation and transfer
  const leaveRoleFee = apiWrapper.estimateLeaveRoleFee(module);
  await apiWrapper.transferBalanceToAccounts(sudo, membersKeyPairs, leaveRoleFee);

  await apiWrapper.batchLeaveRole(membersKeyPairs, uuid().substring(0, 8), false, module);

  // Assertions
  membersKeyPairs.forEach(async keyPair => {
    apiWrapper.getWorkerIdByRoleAccount(keyPair.address, module);
    const newWorkerId = await apiWrapper.getWorkerIdByRoleAccount(keyPair.address, module);
    assert(newWorkerId === undefined, `Worker with account ${keyPair.address} is not terminated`);
  });
}

export async function awaitPayout(apiWrapper: ApiWrapper, membersKeyPairs: KeyringPair[], module: WorkingGroups) {
  const workerId: BN = await apiWrapper.getWorkerIdByRoleAccount(membersKeyPairs[0].address, module);
  const worker: Worker = await apiWrapper.getWorkerById(workerId, module);
  const reward: RewardRelationship = await apiWrapper.getRewardRelationship(worker.reward_relationship.unwrap());
  const now: BN = await apiWrapper.getBestBlock();
  const nextPaymentBlock: BN = new BN(reward.getField('next_payment_at_block').toString());
  const payoutInterval: BN = new BN(reward.getField('payout_interval').toString());
  const amountPerPayout: BN = new BN(reward.getField('amount_per_payout').toString());

  assert(now.lt(nextPaymentBlock), `Payout already happened in block ${nextPaymentBlock} now ${now}`);
  const balance = await apiWrapper.getBalance(membersKeyPairs[0].address);

  const firstPayoutWaitingPeriod = nextPaymentBlock.sub(now).addn(1);
  await Utils.wait(apiWrapper.getBlockDuration().mul(firstPayoutWaitingPeriod).toNumber());

  const balanceAfterFirstPayout = await apiWrapper.getBalance(membersKeyPairs[0].address);
  const expectedBalanceFirst = balance.add(amountPerPayout);
  assert(
    balanceAfterFirstPayout.eq(expectedBalanceFirst),
    `Unexpected balance, expected ${expectedBalanceFirst} got ${balanceAfterFirstPayout}`
  );

  const secondPayoutWaitingPeriod = payoutInterval.addn(1);
  await Utils.wait(apiWrapper.getBlockDuration().mul(secondPayoutWaitingPeriod).toNumber());

  const balanceAfterSecondPayout = await apiWrapper.getBalance(membersKeyPairs[0].address);
  const expectedBalanceSecond = expectedBalanceFirst.add(amountPerPayout);
  assert(
    balanceAfterSecondPayout.eq(expectedBalanceSecond),
    `Unexpected balance, expected ${expectedBalanceSecond} got ${balanceAfterSecondPayout}`
  );
}

export async function setMintCapacity(apiWrapper: ApiWrapper, sudo: KeyringPair, capacity: BN, module: WorkingGroups) {
  await apiWrapper.sudoSetWorkingGroupMintCapacity(sudo, capacity, module);
}
