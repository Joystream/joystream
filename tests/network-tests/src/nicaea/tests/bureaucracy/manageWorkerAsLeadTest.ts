import tap = require('tap');
import { initConfig } from '../../utils/config';
import { registerJoystreamTypes } from '@nicaea/types';
import { closeApi } from '../impl/closeApi';
import { ApiWrapper } from '../../utils/apiWrapper';
import { WsProvider, Keyring } from '@polkadot/api';
import { KeyringPair } from '@polkadot/keyring/types';
import { setTestTimeout } from '../../utils/setTestTimeout';
import { membershipTest } from '../impl/membershipCreation';
import {
  addWorkerOpening,
  applyForWorkerOpening,
  beginApplicationReview,
  fillWorkerOpening,
  setLead,
  unsetLead,
  decreaseWorkerStake,
  slashWorker,
  terminateWorkerRole,
} from './impl/workingGroupModule';
import BN from 'bn.js';

tap.mocha.describe('Manage worker as worker scenario', async () => {
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
  const durationInBlocks: number = 40;
  const openingActivationDelay: BN = new BN(0);

  const provider = new WsProvider(nodeUrl);
  const apiWrapper: ApiWrapper = await ApiWrapper.create(provider);
  const sudo: KeyringPair = keyring.addFromUri(sudoUri);

  setTestTimeout(apiWrapper, durationInBlocks);
  membershipTest(apiWrapper, nKeyPairs, keyring, N, paidTerms, sudoUri);
  membershipTest(apiWrapper, leadKeyPair, keyring, N, paidTerms, sudoUri);

  tap.test('Set lead', async () => setLead(apiWrapper, leadKeyPair[0], sudo));
  let openignId: BN;
  tap.test(
    'Add worker opening',
    async () =>
      (openignId = await addWorkerOpening(
        apiWrapper,
        nKeyPairs,
        leadKeyPair[0],
        sudo,
        applicationStake,
        roleStake,
        openingActivationDelay
      ))
  );
  tap.test(
    'Apply for worker opening',
    async () => await applyForWorkerOpening(apiWrapper, nKeyPairs, sudo, applicationStake, roleStake, openignId, false)
  );
  tap.test('Begin application review', async () => beginApplicationReview(apiWrapper, leadKeyPair[0], sudo, openignId));
  tap.test('Fill worker opening', async () =>
    fillWorkerOpening(apiWrapper, nKeyPairs, leadKeyPair[0], sudo, openignId)
  );

  tap.test('Unset lead', async () => unsetLead(apiWrapper, sudo));
  tap.test('Decrease worker stake, expect failure', async () =>
    decreaseWorkerStake(apiWrapper, nKeyPairs, leadKeyPair[0], sudo, true)
  );
  tap.test('Set lead', async () => setLead(apiWrapper, leadKeyPair[0], sudo));
  tap.test('Decrease worker stake', async () =>
    decreaseWorkerStake(apiWrapper, nKeyPairs, leadKeyPair[0], sudo, false)
  );
  tap.test('Slash worker', async () => slashWorker(apiWrapper, nKeyPairs, leadKeyPair[0], sudo, false));
  tap.test('Terminate worker role', async () =>
    terminateWorkerRole(apiWrapper, nKeyPairs, leadKeyPair[0], sudo, false)
  );

  closeApi(apiWrapper);
});
