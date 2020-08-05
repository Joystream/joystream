import { Keyring } from '@polkadot/api'
import { KeyringPair } from '@polkadot/keyring/types'
import { ApiWrapper } from '../../../utils/apiWrapper'
import { v4 as uuid } from 'uuid'
import BN from 'bn.js'
import { assert } from 'chai'
import { Utils } from '../../../utils/utils'
import tap from 'tap'

export function evictStorageProviderTest(
  apiWrapper: ApiWrapper,
  m1KeyPairs: KeyringPair[],
  m2KeyPairs: KeyringPair[],
  keyring: Keyring,
  sudoUri: string
) {
  let sudo: KeyringPair

  tap.test('Evict storage provider proposal test', async () => {
    // Setup
    sudo = keyring.addFromUri(sudoUri)
    const proposalTitle: string = 'Testing proposal ' + uuid().substring(0, 8)
    const description: string = 'Testing validator count proposal ' + uuid().substring(0, 8)
    const runtimeVoteFee: BN = apiWrapper.estimateVoteForProposalFee()
    await apiWrapper.transferBalanceToAccounts(sudo, m2KeyPairs, runtimeVoteFee)
    if (!(await apiWrapper.isStorageProvider(sudo.address))) {
      await apiWrapper.createStorageProvider(sudo)
    }
    assert(await apiWrapper.isStorageProvider(sudo.address), `Account ${sudo.address} is not storage provider`)

    // Proposal stake calculation
    const proposalStake: BN = new BN(25000)
    const proposalFee: BN = apiWrapper.estimateProposeEvictStorageProviderFee(
      description,
      description,
      proposalStake,
      sudo.address
    )
    await apiWrapper.transferBalance(sudo, m1KeyPairs[0].address, proposalFee.add(proposalStake))

    // Proposal creation
    const proposalPromise = apiWrapper.expectProposalCreated()
    await apiWrapper.proposeEvictStorageProvider(m1KeyPairs[0], proposalTitle, description, proposalStake, sudo.address)
    const proposalNumber = await proposalPromise

    // Approving the proposal
    const proposalExecutionPromise = apiWrapper.expectProposalFinalized()
    await apiWrapper.batchApproveProposal(m2KeyPairs, proposalNumber)
    await proposalExecutionPromise
    await Utils.wait(apiWrapper.getBlockDuration().toNumber())
    assert(
      !(await apiWrapper.isStorageProvider(sudo.address)),
      `Account ${sudo.address} is storage provider after eviction`
    )
  })
}
