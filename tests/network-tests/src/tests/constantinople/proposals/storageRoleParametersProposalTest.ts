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
import { RoleParameters } from '@joystream/types/lib/roles';

describe('Storage role parameters proposal network tests', () => {
  initConfig();
  const keyring = new Keyring({ type: 'sr25519' });
  const nodeUrl: string = process.env.NODE_URL!;
  const sudoUri: string = process.env.SUDO_ACCOUNT_URI!;
  const defaultTimeout: number = 180000;

  const m1KeyPairs: KeyringPair[] = new Array();
  const m2KeyPairs: KeyringPair[] = new Array();

  let apiWrapper: ApiWrapper;
  let sudo: KeyringPair;

  before(async function () {
    this.timeout(defaultTimeout);
    registerJoystreamTypes();
    const provider = new WsProvider(nodeUrl);
    apiWrapper = await ApiWrapper.create(provider);
  });

  membershipTest(m1KeyPairs);
  membershipTest(m2KeyPairs);
  councilTest(m1KeyPairs, m2KeyPairs);

  it('Storage role parameters proposal test', async () => {
    // Setup
    sudo = keyring.addFromUri(sudoUri);
    const proposalTitle: string = 'Testing proposal ' + uuid().substring(0, 8);
    const description: string = 'Testing validator count proposal ' + uuid().substring(0, 8);
    const runtimeVoteFee: BN = apiWrapper.estimateVoteForProposalFee();
    await apiWrapper.transferBalanceToAccounts(sudo, m2KeyPairs, runtimeVoteFee);
    const roleParameters: RoleParameters = ((await apiWrapper.getStorageRoleParameters()) as unknown) as RoleParameters;
    console.log('role parameters ' + roleParameters);
    console.log('role parameters ' + roleParameters.toRawType());
    console.log('role parameters min stake ' + roleParameters.min_stake);

    // Proposal stake calculation
    const proposalStake: BN = await apiWrapper.getRequiredProposalStake(25, 10000);
    const proposalFee: BN = apiWrapper.estimateProposeStorageRoleParametersFee(
      description,
      description,
      proposalStake,
      roleParameters.min_stake.toBn(),
      roleParameters.min_actors.toBn(),
      roleParameters.max_actors.toBn(),
      roleParameters.reward.toBn(),
      roleParameters.reward_period.toBn(),
      roleParameters.bonding_period.toBn(),
      roleParameters.unbonding_period.toBn(),
      roleParameters.min_service_period.toBn(),
      roleParameters.startup_grace_period.toBn(),
      roleParameters.entry_request_fee.toBn()
    );
    await apiWrapper.transferBalance(sudo, m1KeyPairs[0].address, proposalFee.add(proposalStake));

    // Proposal creation
    console.log('proposing new parameters');
    const proposalPromise = apiWrapper.expectProposalCreated();
    await apiWrapper.proposeStorageRoleParameters(
      m1KeyPairs[0],
      proposalTitle,
      description,
      proposalStake,
      roleParameters.min_stake.toBn(),
      roleParameters.min_actors.toBn(),
      roleParameters.max_actors.toBn(),
      roleParameters.reward.toBn(),
      roleParameters.reward_period.toBn(),
      roleParameters.bonding_period.toBn(),
      roleParameters.unbonding_period.toBn(),
      roleParameters.min_service_period.toBn(),
      roleParameters.startup_grace_period.toBn(),
      roleParameters.entry_request_fee.toBn()
    );
    const proposalNumber = await proposalPromise;

    // Approving the proposal
    const proposalExecutionPromise = apiWrapper.expectProposalFinalized();
    await apiWrapper.batchApproveProposal(m2KeyPairs, proposalNumber);
    await proposalExecutionPromise;
    const newRoleParameters: RoleParameters = await apiWrapper.getStorageRoleParameters();
    console.log('new role parameters ' + newRoleParameters);

    // const newLead: string = await apiWrapper.getCurrentLeadAddress();
    // assert(
    //   newLead === m1KeyPairs[1].address,
    //   `New lead has unexpected value ${newLead}, expected ${m1KeyPairs[1].address}`
    // );
  }).timeout(defaultTimeout);

  after(() => {
    apiWrapper.close();
  });
});
