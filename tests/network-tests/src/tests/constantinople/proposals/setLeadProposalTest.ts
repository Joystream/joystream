import { initConfig } from '../utils/config';
import { Keyring, WsProvider } from '@polkadot/api';
import { KeyringPair } from '@polkadot/keyring/types';
import { membershipTest } from '../membershipCreationTest';
import { councilTest } from '../electingCouncilTest';
import { registerJoystreamTypes } from '@joystream/types';
import { ApiWrapper } from '../utils/apiWrapper';
import { v4 as uuid } from 'uuid';
import BN from 'bn.js';
import { assert } from 'chai';
import tap from 'tap';

export function setLeadProposalTest(m1KeyPairs: KeyringPair[], m2KeyPairs: KeyringPair[]) {
  initConfig();
  const keyring = new Keyring({ type: 'sr25519' });
  const nodeUrl: string = process.env.NODE_URL!;
  const sudoUri: string = process.env.SUDO_ACCOUNT_URI!;
  const defaultTimeout: number = 600000;

  let apiWrapper: ApiWrapper;
  let sudo: KeyringPair;

  tap.setTimeout(defaultTimeout);

  tap.test('Set lead proposal test', async () => {
    registerJoystreamTypes();
    const provider = new WsProvider(nodeUrl);
    apiWrapper = await ApiWrapper.create(provider);
  });

  tap.test('Lead proposal test', async () => {
    // Setup
    sudo = keyring.addFromUri(sudoUri);
    const proposalTitle: string = 'Testing proposal ' + uuid().substring(0, 8);
    const description: string = 'Testing validator count proposal ' + uuid().substring(0, 8);
    const runtimeVoteFee: BN = apiWrapper.estimateVoteForProposalFee();
    await apiWrapper.transferBalanceToAccounts(sudo, m2KeyPairs, runtimeVoteFee);

    // Proposal stake calculation
    const proposalStake: BN = new BN(50000);
    const proposalFee: BN = apiWrapper.estimateProposeLeadFee(description, description, proposalStake, sudo.address);
    await apiWrapper.transferBalance(sudo, m1KeyPairs[0].address, proposalFee.add(proposalStake));

    // Proposal creation
    const proposalPromise = apiWrapper.expectProposalCreated();
    await apiWrapper.proposeLead(m1KeyPairs[0], proposalTitle, description, proposalStake, m1KeyPairs[1]);
    const proposalNumber = await proposalPromise;

    // Approving the proposal
    const proposalExecutionPromise = apiWrapper.expectProposalFinalized();
    await apiWrapper.batchApproveProposal(m2KeyPairs, proposalNumber);
    await proposalExecutionPromise;
    const newLead: string = await apiWrapper.getCurrentLeadAddress();
    assert(
      newLead === m1KeyPairs[1].address,
      `New lead has unexpected value ${newLead}, expected ${m1KeyPairs[1].address}`
    );
  });

  tap.teardown(() => {
    apiWrapper.close();
  });
}

const m1Keys: KeyringPair[] = new Array();
const m2Keys: KeyringPair[] = new Array();

membershipTest(m1Keys);
membershipTest(m2Keys);
councilTest(m1Keys, m2Keys);
setLeadProposalTest(m1Keys, m2Keys);
