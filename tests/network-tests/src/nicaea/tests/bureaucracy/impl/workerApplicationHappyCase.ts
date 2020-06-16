import tap from 'tap';
import { ApiWrapper } from '../../../utils/apiWrapper';
import { KeyringPair } from '@polkadot/keyring/types';
import { Keyring } from '@polkadot/api';
import BN from 'bn.js';
import { Utils } from '../../../utils/utils';

export function workerApplicationHappyCase(
  apiWrapper: ApiWrapper,
  membersKeyPairs: KeyringPair[],
  leadArray: KeyringPair[],
  keyring: Keyring,
  sudoUri: string,
  applicationStake: BN,
  roleStake: BN
) {
  let sudo: KeyringPair;
  let lead: KeyringPair;

  tap.test('Set lead test', async () => {
    sudo = keyring.addFromUri(sudoUri);
    lead = leadArray[0];
    await apiWrapper.sudoSetLead(sudo, lead);
  });

  tap.test('Add worker opening', async () => {
    //Fee estimation and transfer
    const addWorkerOpeningFee: BN = apiWrapper.estimateAddWorkerOpeningFee();
    const beginReviewFee: BN = apiWrapper.estimateBeginWorkerApplicantReviewFee();
    const fillWorkerOpeningFee: BN = apiWrapper.estimateFillWorkerOpeningFee();
    await apiWrapper.transferBalance(
      sudo,
      lead.address,
      addWorkerOpeningFee.add(beginReviewFee).add(fillWorkerOpeningFee)
    );

    //Worker opening creation
    const workerOpeningId: BN = await apiWrapper.getNextWorkerOpeningId();
    await apiWrapper.addWorkerOpening(
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

    //Applying for created worker opening
    const nextApplicationId: BN = await apiWrapper.getNextApplicationId();
    const applyOnOpeningFee: BN = apiWrapper.estimateApplyOnOpeningFee(lead).add(applicationStake).add(roleStake);
    await apiWrapper.transferBalanceToAccounts(sudo, membersKeyPairs, applyOnOpeningFee);
    await apiWrapper.batchApplyOnWorkerOpening(membersKeyPairs, workerOpeningId, roleStake, applicationStake, '');

    //Begin application review
    await apiWrapper.beginWorkerApplicationReview(lead, workerOpeningId);

    //Fill worker opening
    await apiWrapper.fillWorkerOpening(
      lead,
      workerOpeningId,
      Utils.getNextNIds(nextApplicationId, membersKeyPairs.length),
      new BN(1),
      new BN(99999999),
      new BN(99999999)
    );
  });
}
