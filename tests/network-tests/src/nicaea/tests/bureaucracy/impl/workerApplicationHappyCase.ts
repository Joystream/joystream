import tap from 'tap';
import { ApiWrapper } from '../../../utils/apiWrapper';
import { KeyringPair } from '@polkadot/keyring/types';
import { Keyring } from '@polkadot/api';
import BN from 'bn.js';

export function workerApplicationHappyCase(
  apiWrapper: ApiWrapper,
  membersKeyPairs: KeyringPair[],
  leadArray: KeyringPair[],
  keyring: Keyring,
  sudoUri: string
) {
  let sudo: KeyringPair;
  //   let lead = leadArray[0];

  tap.test('Set lead test', async () => {
    sudo = keyring.addFromUri(sudoUri);
    const lead = leadArray[0];
    await apiWrapper.sudoSetLead(sudo, lead);
  });

  tap.test('Add worker opening', async () => {
    const addWorkerOpeningFee: BN = apiWrapper.estimateAddWorkerOpeningFee();
    await apiWrapper.transferBalance(sudo, lead.address, addWorkerOpeningFee);
    const workerOpeningId: BN = await apiWrapper.getNextWorkerOpeningId();
    await apiWrapper.addWorkerOpening(lead, membersKeyPairs.length, 'some text');
    console.log('test in process 1');

    const beginAcceptingApplicationsFee = apiWrapper.estimateAcceptWorkerApplicationsFee();
    await apiWrapper.transferBalance(sudo, lead.address, beginAcceptingApplicationsFee);
    await apiWrapper.acceptWorkerApplications(lead, workerOpeningId);
    console.log('test in process 2');
    //   });

    //   tap.test('Apply for worker opening', async () => {
    const nextApplicationId: BN = await apiWrapper.getNextApplicationId();
    const applyOnOpeningFee: BN = apiWrapper.estimateApplyOnOpeningFee(lead);
    await apiWrapper.transferBalanceToAccounts(sudo, membersKeyPairs, applyOnOpeningFee);
    await apiWrapper.batchApplyOnWorkerOpening(membersKeyPairs, workerOpeningId);
    console.log('test in process 3');
    //   });

    //   tap.test('Begin worker application review', async () => {
    const beginReviewFee: BN = apiWrapper.estimateBeginWorkerApplicantReviewFee();
    await apiWrapper.beginWorkerApplicationReview(lead);
    console.log('test in process 4');
    //   });

    //   tap.test('Fill worker opening', async () => {
    const fillWorkerOpeningFee: BN = apiWrapper.estimateFillWorkerOpeningFee();
    await apiWrapper.transferBalance(sudo, lead.address, fillWorkerOpeningFee.muln(membersKeyPairs.length));
    await apiWrapper.batchFillWorkerOpening(lead, membersKeyPairs, nextApplicationId, workerOpeningId);
  });
}
