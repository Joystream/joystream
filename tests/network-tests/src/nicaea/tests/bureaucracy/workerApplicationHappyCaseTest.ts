import tap from 'tap';
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
  withdrawWorkerApplicaiton,
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
  const durationInBlocks: number = 28;

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
      (openignId = await addWorkerOpening(apiWrapper, nKeyPairs, leadKeyPair[0], sudo, applicationStake, roleStake))
  );
  tap.test('Apply for worker opening', async () =>
    applyForWorkerOpening(apiWrapper, nKeyPairs, sudo, applicationStake, roleStake, openignId)
  );
  tap.test('Withdraw worker application', async () => withdrawWorkerApplicaiton(apiWrapper, nKeyPairs, sudo));
  tap.test('Apply for worker opening', async () =>
    applyForWorkerOpening(apiWrapper, nKeyPairs, sudo, applicationStake, roleStake, openignId)
  );
  tap.test('Begin application review', async () => beginApplicationReview(apiWrapper, leadKeyPair[0], sudo, openignId));
  tap.test('Fill worker opening', async () =>
    fillWorkerOpening(apiWrapper, nKeyPairs, leadKeyPair[0], sudo, openignId)
  );

  closeApi(apiWrapper);
});
