import tap from 'tap';
import { initConfig } from '../../utils/config';
import { registerJoystreamTypes } from '@nicaea/types';
import { closeApi } from '../impl/closeApi';
import { ApiWrapper } from '../../utils/apiWrapper';
import { WsProvider, Keyring } from '@polkadot/api';
import { KeyringPair } from '@polkadot/keyring/types';
import { setTestTimeout } from '../../utils/setTestTimeout';
import { membershipTest } from '../impl/membershipCreation';
import { workerApplicationHappyCase } from './impl/workerApplicationHappyCase';

tap.mocha.describe('Worker application happy case scenario', async () => {
  initConfig();
  registerJoystreamTypes();

  const nKeyPairs: KeyringPair[] = new Array();

  const keyring = new Keyring({ type: 'sr25519' });
  const N: number = +process.env.WORKING_GROUP_N!;
  const paidTerms: number = +process.env.MEMBERSHIP_PAID_TERMS!;
  const nodeUrl: string = process.env.NODE_URL!;
  const sudoUri: string = process.env.SUDO_ACCOUNT_URI!;
  const durationInBlocks: number = 25;

  const provider = new WsProvider(nodeUrl);
  const apiWrapper: ApiWrapper = await ApiWrapper.create(provider);

  setTestTimeout(apiWrapper, durationInBlocks);
  membershipTest(apiWrapper, nKeyPairs, keyring, N, paidTerms, sudoUri);
  workerApplicationHappyCase(apiWrapper, nKeyPairs, keyring, sudoUri);

  closeApi(apiWrapper);
});
