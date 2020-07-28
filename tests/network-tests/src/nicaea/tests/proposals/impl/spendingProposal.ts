import { Keyring } from '@polkadot/api'
import { KeyringPair } from '@polkadot/keyring/types'
import { ApiWrapper } from '../../../utils/apiWrapper'
import { v4 as uuid } from 'uuid'
import BN from 'bn.js'
import { assert } from 'chai'
import tap from 'tap'

export function spendingProposalTest(
  apiWrapper: ApiWrapper,
  m1KeyPairs: KeyringPair[],
  m2KeyPairs: KeyringPair[],
  keyring: Keyring,
  sudoUri: string,
  spendingBalance: BN,
  mintCapacity: BN
) {
  let sudo: KeyringPair

  tap.test('Spending proposal test', async () => {
    // Setup
    sudo = keyring.addFromUri(sudoUri)
    const description = 'spending proposal which is used for API network testing with some mock data'
    const runtimeVoteFee: BN = apiWrapper.estimateVoteForProposalFee()

    // Topping the balances
    const proposalStake: BN = new BN(25000)
    const runtimeProposalFee: BN = apiWrapper.estimateProposeSpendingFee(
      description,
      description,
      proposalStake,
      spendingBalance,
      sudo.address
    )
    await apiWrapper.transferBalance(sudo, m1KeyPairs[0].address, runtimeProposalFee.add(proposalStake))
    await apiWrapper.transferBalanceToAccounts(sudo, m2KeyPairs, runtimeVoteFee)
    await apiWrapper.sudoSetCouncilMintCapacity(sudo, mintCapacity)

    // Proposal creation
    const proposalPromise = apiWrapper.expectProposalCreated()
    await apiWrapper.proposeSpending(
      m1KeyPairs[0],
      'testing spending' + uuid().substring(0, 8),
      'spending to test proposal functionality' + uuid().substring(0, 8),
      proposalStake,
      spendingBalance,
      sudo.address
    )
    const proposalNumber = await proposalPromise

    // Approving spending proposal
    const balanceBeforeMinting: BN = await apiWrapper.getBalance(sudo.address)
    const spendingPromise = apiWrapper.expectProposalFinalized()
    await apiWrapper.batchApproveProposal(m2KeyPairs, proposalNumber)
    await spendingPromise
    const balanceAfterMinting: BN = await apiWrapper.getBalance(sudo.address)
    assert(
      balanceAfterMinting.sub(balanceBeforeMinting).eq(spendingBalance),
      `member ${
        m1KeyPairs[0].address
      } has unexpected balance ${balanceAfterMinting}, expected ${balanceBeforeMinting.add(spendingBalance)}`
    )
  })
}
