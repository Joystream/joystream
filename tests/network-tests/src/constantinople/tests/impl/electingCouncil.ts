import { KeyringPair } from '@polkadot/keyring/types';
import { ApiWrapper } from '../../utils/apiWrapper';
import { Keyring } from '@polkadot/api';
import BN from 'bn.js';
import { Seat } from '@constantinople/types';
import { assert } from 'chai';
import { v4 as uuid } from 'uuid';
import { Utils } from '../../utils/utils';
import tap from 'tap';

export function councilTest(
  apiWrapper: ApiWrapper,
  m1KeyPairs: KeyringPair[],
  m2KeyPairs: KeyringPair[],
  keyring: Keyring,
  K: number,
  sudoUri: string,
  greaterStake: BN,
  lesserStake: BN
) {
  let sudo: KeyringPair;

  tap.test('Electing a council test', async () => {
    // Setup goes here because M keypairs are generated after before() function
    sudo = keyring.addFromUri(sudoUri);
    let now = await apiWrapper.getBestBlock();
    const applyForCouncilFee: BN = apiWrapper.estimateApplyForCouncilFee(greaterStake);
    const voteForCouncilFee: BN = apiWrapper.estimateVoteForCouncilFee(sudo.address, sudo.address, greaterStake);
    const salt: string[] = new Array();
    m1KeyPairs.forEach(() => {
      salt.push(''.concat(uuid().replace(/-/g, '')));
    });
    const revealVoteFee: BN = apiWrapper.estimateRevealVoteFee(sudo.address, salt[0]);

    // Topping the balances
    await apiWrapper.transferBalanceToAccounts(sudo, m2KeyPairs, applyForCouncilFee.add(greaterStake));
    await apiWrapper.transferBalanceToAccounts(
      sudo,
      m1KeyPairs,
      voteForCouncilFee.add(revealVoteFee).add(greaterStake)
    );

    // First K members stake more
    await apiWrapper.sudoStartAnnouncingPerion(sudo, now.addn(100));
    await apiWrapper.batchApplyForCouncilElection(m2KeyPairs.slice(0, K), greaterStake);
    m2KeyPairs.slice(0, K).forEach(keyPair =>
      apiWrapper.getCouncilElectionStake(keyPair.address).then(stake => {
        assert(
          stake.eq(greaterStake),
          `${keyPair.address} not applied correctrly for council election with stake ${stake} versus expected ${greaterStake}`
        );
      })
    );

    // Last members stake less
    await apiWrapper.batchApplyForCouncilElection(m2KeyPairs.slice(K), lesserStake);
    m2KeyPairs.slice(K).forEach(keyPair =>
      apiWrapper.getCouncilElectionStake(keyPair.address).then(stake => {
        assert(
          stake.eq(lesserStake),
          `${keyPair.address} not applied correctrly for council election with stake ${stake} versus expected ${lesserStake}`
        );
      })
    );

    // Voting
    await apiWrapper.sudoStartVotingPerion(sudo, now.addn(100));
    await apiWrapper.batchVoteForCouncilMember(
      m1KeyPairs.slice(0, K),
      m2KeyPairs.slice(0, K),
      salt.slice(0, K),
      lesserStake
    );
    await apiWrapper.batchVoteForCouncilMember(m1KeyPairs.slice(K), m2KeyPairs.slice(K), salt.slice(K), greaterStake);

    // Revealing
    await apiWrapper.sudoStartRevealingPerion(sudo, now.addn(100));
    await apiWrapper.batchRevealVote(m1KeyPairs.slice(0, K), m2KeyPairs.slice(0, K), salt.slice(0, K));
    await apiWrapper.batchRevealVote(m1KeyPairs.slice(K), m2KeyPairs.slice(K), salt.slice(K));
    now = await apiWrapper.getBestBlock();

    // Resolving election
    // 3 is to ensure the revealing block is in future
    await apiWrapper.sudoStartRevealingPerion(sudo, now.addn(3));
    await Utils.wait(apiWrapper.getBlockDuration().muln(2.5).toNumber());
    const seats: Seat[] = await apiWrapper.getCouncil();

    // Preparing collections to increase assertion readability
    const m2addresses: string[] = m2KeyPairs.map(keyPair => keyPair.address);
    const m1addresses: string[] = m1KeyPairs.map(keyPair => keyPair.address);
    const members: string[] = seats.map(seat => seat.member.toString());
    const bakers: string[] = seats.reduce(
      (array, seat) => array.concat(seat.backers.map(baker => baker.member.toString())),
      new Array()
    );

    // Assertions
    m2addresses.forEach(address => assert(members.includes(address), `Account ${address} is not in the council`));
    m1addresses.forEach(address => assert(bakers.includes(address), `Account ${address} is not in the voters`));
    seats.forEach(seat =>
      assert(
        Utils.getTotalStake(seat).eq(greaterStake.add(lesserStake)),
        `Member ${seat.member} has unexpected stake ${Utils.getTotalStake(seat)}`
      )
    );
  });
}
