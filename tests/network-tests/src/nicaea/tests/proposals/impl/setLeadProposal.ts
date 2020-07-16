import { Keyring } from '@polkadot/api'
import { KeyringPair } from '@polkadot/keyring/types'
import { ApiWrapper } from '../../../utils/apiWrapper'
import { v4 as uuid } from 'uuid'
import BN from 'bn.js'
import { assert } from 'chai'
import tap from 'tap'

export function setLeadProposalTest(
  apiWrapper: ApiWrapper,
  m1KeyPairs: KeyringPair[],
  m2KeyPairs: KeyringPair[],
  keyring: Keyring,
  sudoUri: string
) {
  let sudo: KeyringPair

  tap.test('Lead proposal test', async () => {
    // Setup
    sudo = keyring.addFromUri(sudoUri)
    const proposalTitle: string = 'Testing proposal ' + uuid().substring(0, 8)
    const description: string = 'Testing validator count proposal ' + uuid().substring(0, 8)
    const runtimeVoteFee: BN = apiWrapper.estimateVoteForProposalFee()
    await apiWrapper.transferBalanceToAccounts(sudo, m2KeyPairs, runtimeVoteFee)

    // Proposal stake calculation
    const proposalStake: BN = new BN(50000)
    const proposalFee: BN = apiWrapper.estimateProposeLeadFee(description, description, proposalStake, sudo.address)
    await apiWrapper.transferBalance(sudo, m1KeyPairs[0].address, proposalFee.add(proposalStake))

    // Proposal creation
    const proposalPromise = apiWrapper.expectProposalCreated()
    await apiWrapper.proposeLead(m1KeyPairs[0], proposalTitle, description, proposalStake, m1KeyPairs[1])
    const proposalNumber = await proposalPromise

    // Approving the proposal
    const proposalExecutionPromise = apiWrapper.expectProposalFinalized()
    await apiWrapper.batchApproveProposal(m2KeyPairs, proposalNumber)
    await proposalExecutionPromise
    const newLead: string = await apiWrapper.getCurrentLeadAddress()
    assert(
      newLead === m1KeyPairs[1].address,
      `New lead has unexpected value ${newLead}, expected ${m1KeyPairs[1].address}`
    )
  })
}
