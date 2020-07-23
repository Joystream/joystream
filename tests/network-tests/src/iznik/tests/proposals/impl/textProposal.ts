import { Keyring } from '@polkadot/api'
import { KeyringPair } from '@polkadot/keyring/types'
import { ApiWrapper } from '../../../utils/apiWrapper'
import { v4 as uuid } from 'uuid'
import BN from 'bn.js'
import tap from 'tap'

export function textProposalTest(
  apiWrapper: ApiWrapper,
  m1KeyPairs: KeyringPair[],
  m2KeyPairs: KeyringPair[],
  keyring: Keyring,
  sudoUri: string
) {
  let sudo: KeyringPair

  tap.test('Text proposal test', async () => {
    // Setup
    sudo = keyring.addFromUri(sudoUri)
    const proposalTitle: string = 'Testing proposal ' + uuid().substring(0, 8)
    const description: string = 'Testing text proposal ' + uuid().substring(0, 8)
    const proposalText: string = 'Text of the testing proposal ' + uuid().substring(0, 8)
    const runtimeVoteFee: BN = apiWrapper.estimateVoteForProposalFee()
    await apiWrapper.transferBalanceToAccounts(sudo, m2KeyPairs, runtimeVoteFee)

    // Proposal stake calculation
    const proposalStake: BN = new BN(25000)
    const runtimeProposalFee: BN = apiWrapper.estimateProposeTextFee(
      proposalStake,
      description,
      description,
      proposalText
    )
    await apiWrapper.transferBalance(sudo, m1KeyPairs[0].address, runtimeProposalFee.add(proposalStake))

    // Proposal creation
    const proposalPromise = apiWrapper.expectProposalCreated()
    await apiWrapper.proposeText(m1KeyPairs[0], proposalStake, proposalTitle, description, proposalText)
    const proposalNumber = await proposalPromise

    // Approving text proposal
    const textProposalPromise = apiWrapper.expectProposalFinalized()
    await apiWrapper.batchApproveProposal(m2KeyPairs, proposalNumber)
    await textProposalPromise
  })
}
