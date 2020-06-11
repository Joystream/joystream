import tap from 'tap';
import { ApiWrapper } from '../../../utils/apiWrapper';
import { KeyringPair } from '@polkadot/keyring/types';
import { Keyring } from '@polkadot/api';
import BN from 'bn.js';

export function workerApplicationHappyCase(
  apiWrapper: ApiWrapper,
  membersKeyPairs: KeyringPair[],
  keyring: Keyring,
  sudoUri: string
) {
  let sudo: KeyringPair;

  tap.test('Set lead test', async () => {
    sudo = keyring.addFromUri(sudoUri);
    await apiWrapper.sudoSetLead(sudo, membersKeyPairs[0]);
  });

  tap.test('Add worker opening', async () => {
    const addWorkerOpeningFee: BN = apiWrapper.estimateAddWorkerOpeningFee();
    apiWrapper.transferBalance(sudo, membersKeyPairs[0].address, addWorkerOpeningFee.muln(membersKeyPairs.length));
    apiWrapper.addWorkerOpening(membersKeyPairs[0], 'CurrentBlock', 'some text');
  });
}
