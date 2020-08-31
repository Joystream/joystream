import tap from 'tap';
import { initConfig } from '../../utils/config';
import { registerJoystreamTypes } from '@nicaea/types';
import { closeApi } from '../impl/closeApi';
import { ApiWrapper, WorkingGroups } from '../../utils/apiWrapper';
import { WsProvider, Keyring } from '@polkadot/api';
import { KeyringPair } from '@polkadot/keyring/types';
import { setTestTimeout } from '../../utils/setTestTimeout';
import { membershipTest } from '../impl/membershipCreation';
import {
  addWorkerOpening,
  applyForOpening,
  beginApplicationReview,
  fillOpening,
  addLeaderOpening,
  beginLeaderApplicationReview,
  fillLeaderOpening,
  leaveRole,
  awaitPayout,
  setMintCapacity,
} from './impl/workingGroupModule';
import BN from 'bn.js';

tap.mocha.describe('Worker application happy case scenario', async () => {
  initConfig();
  registerJoystreamTypes();

  const nKeyPairs: KeyringPair[] = new Array();
  const leadKeyPair: KeyringPair[] = new Array();

  const keyring = new Keyring({ type: 'sr25519' });
  const N: number = +process.env.WORKING_GROUP_N!;
  const paidTerms: number = +process.env.MEMBERSHIP_PAID_TERMS!;
  const nodeUrl: string = process.env.NODE_URL!;
  const sudoUri: string = process.env.SUDO_ACCOUNT_URI!;
  const applicationStake: BN = new BN(process.env.WORKING_GROUP_APPLICATION_STAKE!);
  const roleStake: BN = new BN(process.env.WORKING_GROUP_ROLE_STAKE!);
  const firstRewardInterval: BN = new BN(process.env.SHORT_FIRST_REWARD_INTERWAL!);
  const rewardInterval: BN = new BN(process.env.SHORT_REWARD_INTERWAL!);
  const payoutAmount: BN = new BN(process.env.PAYOUT_AMOUNT!);
  const unstakingPeriod: BN = new BN(process.env.STORAGE_WORKING_GROUP_UNSTAKING_PERIOD!);
  const mintCapacity: BN = new BN(process.env.STORAGE_WORKING_GROUP_MINTING_CAPACITY!);
  const durationInBlocks: number = 48;
  const openingActivationDelay: BN = new BN(0);

  const provider = new WsProvider(nodeUrl);
  const apiWrapper: ApiWrapper = await ApiWrapper.create(provider);
  const sudo: KeyringPair = keyring.addFromUri(sudoUri);

  setTestTimeout(apiWrapper, durationInBlocks);
  membershipTest(apiWrapper, nKeyPairs, keyring, N, paidTerms, sudoUri);
  membershipTest(apiWrapper, leadKeyPair, keyring, 1, paidTerms, sudoUri);

  let leadOpenignId: BN;
  tap.test(
    'Add lead opening',
    async () =>
      (leadOpenignId = await addLeaderOpening(
        apiWrapper,
        nKeyPairs,
        sudo,
        applicationStake,
        roleStake,
        openingActivationDelay,
        WorkingGroups.storageWorkingGroup
      ))
  );
  tap.test(
    'Apply for lead opening',
    async () =>
      await applyForOpening(
        apiWrapper,
        leadKeyPair,
        sudo,
        applicationStake,
        roleStake,
        leadOpenignId,
        WorkingGroups.storageWorkingGroup,
        false
      )
  );
  tap.test('Begin lead application review', async () =>
    beginLeaderApplicationReview(apiWrapper, sudo, leadOpenignId, WorkingGroups.storageWorkingGroup)
  );
  tap.test('Fill lead opening', async () =>
    fillLeaderOpening(
      apiWrapper,
      leadKeyPair,
      sudo,
      leadOpenignId,
      firstRewardInterval,
      rewardInterval,
      payoutAmount,
      WorkingGroups.storageWorkingGroup
    )
  );

  let workerOpenignId: BN;
  tap.test(
    'Add worker opening',
    async () =>
      (workerOpenignId = await addWorkerOpening(
        apiWrapper,
        nKeyPairs,
        leadKeyPair[0],
        sudo,
        applicationStake,
        roleStake,
        openingActivationDelay,
        unstakingPeriod,
        WorkingGroups.storageWorkingGroup,
        false
      ))
  );
  tap.test('Apply for worker opening', async () =>
    applyForOpening(
      apiWrapper,
      nKeyPairs,
      sudo,
      applicationStake,
      roleStake,
      workerOpenignId,
      WorkingGroups.storageWorkingGroup,
      false
    )
  );
  tap.test('Begin application review', async () =>
    beginApplicationReview(apiWrapper, leadKeyPair[0], sudo, workerOpenignId, WorkingGroups.storageWorkingGroup)
  );
  tap.test('Set mint capacity', async () =>
    setMintCapacity(apiWrapper, sudo, mintCapacity, WorkingGroups.storageWorkingGroup)
  );
  tap.test('Fill worker opening', async () =>
    fillOpening(
      apiWrapper,
      nKeyPairs,
      leadKeyPair[0],
      sudo,
      workerOpenignId,
      firstRewardInterval,
      rewardInterval,
      payoutAmount,
      WorkingGroups.storageWorkingGroup
    )
  );

  tap.test('Await worker payout', async () => awaitPayout(apiWrapper, nKeyPairs, WorkingGroups.storageWorkingGroup));

  tap.test('Leaving lead role', async () =>
    leaveRole(apiWrapper, leadKeyPair, sudo, WorkingGroups.storageWorkingGroup)
  );

  closeApi(apiWrapper);
});
