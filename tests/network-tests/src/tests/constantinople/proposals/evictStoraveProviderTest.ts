import { initConfig } from '../../../utils/config';
import { Keyring, WsProvider } from '@polkadot/api';
import { KeyringPair } from '@polkadot/keyring/types';
import { membershipTest } from '../membershipCreationTest';
import { councilTest } from '../electingCouncilTest';
import { registerJoystreamTypes } from '@joystream/types';
import { ApiWrapper } from '../../../utils/apiWrapper';
import { v4 as uuid } from 'uuid';
import BN = require('bn.js');
import { assert } from 'chai';
import { Utils } from '../../../utils/utils';

export function evictStorageProviderTest(m1KeyPairs: KeyringPair[], m2KeyPairs: KeyringPair[]) {
  initConfig();
  const keyring = new Keyring({ type: 'sr25519' });
  const nodeUrl: string = process.env.NODE_URL!;
  const sudoUri: string = process.env.SUDO_ACCOUNT_URI!;
  const defaultTimeout: number = 180000;

  let apiWrapper: ApiWrapper;
  let sudo: KeyringPair;

  before(async function () {
    this.timeout(defaultTimeout);
    registerJoystreamTypes();
    const provider = new WsProvider(nodeUrl);
    apiWrapper = await ApiWrapper.create(provider);
  });

  it('\n\tEvict storage provider proposal test', async () => {
    // Setup
    sudo = keyring.addFromUri(sudoUri);
    const proposalTitle: string = 'Testing proposal ' + uuid().substring(0, 8);
    const description: string = 'Testing validator count proposal ' + uuid().substring(0, 8);
    const runtimeVoteFee: BN = apiWrapper.estimateVoteForProposalFee();
    await apiWrapper.transferBalanceToAccounts(sudo, m2KeyPairs, runtimeVoteFee);
    if (!(await apiWrapper.isStorageProvider(sudo.address))) {
      await apiWrapper.createStorageProvider(sudo);
    }
    assert(await apiWrapper.isStorageProvider(sudo.address), `Account ${sudo.address} is not storage provider`);

    // Proposal stake calculation
    const proposalStake: BN = new BN(25000);
    const proposalFee: BN = apiWrapper.estimateProposeEvictStorageProviderFee(
      description,
      description,
      proposalStake,
      sudo.address
    );
    await apiWrapper.transferBalance(sudo, m1KeyPairs[0].address, proposalFee.add(proposalStake));

    // Proposal creation
    const proposalPromise = apiWrapper.expectProposalCreated();
    await apiWrapper.proposeEvictStorageProvider(
      m1KeyPairs[0],
      proposalTitle,
      description,
      proposalStake,
      sudo.address
    );
    const proposalNumber = await proposalPromise;

    // Approving the proposal
    const proposalExecutionPromise = apiWrapper.expectProposalFinalized();
    await apiWrapper.batchApproveProposal(m2KeyPairs, proposalNumber);
    await proposalExecutionPromise;
    await Utils.wait(apiWrapper.getBlockDuration().toNumber());
    assert(
      !(await apiWrapper.isStorageProvider(sudo.address)),
      `Account ${sudo.address} is storage provider after eviction`
    );
  }).timeout(defaultTimeout);

  after(() => {
    apiWrapper.close();
  });
}

describe('Evict storage provider proposal network tests', () => {
  const m1KeyPairs: KeyringPair[] = new Array();
  const m2KeyPairs: KeyringPair[] = new Array();

  membershipTest(m1KeyPairs);
  membershipTest(m2KeyPairs);
  councilTest(m1KeyPairs, m2KeyPairs);
  evictStorageProviderTest(m1KeyPairs, m2KeyPairs);
});
