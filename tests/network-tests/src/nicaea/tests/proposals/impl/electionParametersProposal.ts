import { Keyring } from '@polkadot/api'
import { KeyringPair } from '@polkadot/keyring/types'
import { ApiWrapper } from '../../../utils/apiWrapper'
import { v4 as uuid } from 'uuid'
import BN from 'bn.js'
import { assert } from 'chai'
import tap from 'tap'

export function electionParametersProposalTest(
  apiWrapper: ApiWrapper,
  m1KeyPairs: KeyringPair[],
  m2KeyPairs: KeyringPair[],
  keyring: Keyring,
  sudoUri: string
) {
  let sudo: KeyringPair

  tap.test('Election parameters proposal test', async () => {
    // Setup
    sudo = keyring.addFromUri(sudoUri)
    const proposalTitle: string = 'Testing proposal ' + uuid().substring(0, 8)
    const description: string = 'Testing validator count proposal ' + uuid().substring(0, 8)
    const runtimeVoteFee: BN = apiWrapper.estimateVoteForProposalFee()
    await apiWrapper.transferBalanceToAccounts(sudo, m2KeyPairs, runtimeVoteFee)
    const announcingPeriod: BN = await apiWrapper.getAnnouncingPeriod()
    const votingPeriod: BN = await apiWrapper.getVotingPeriod()
    const revealingPeriod: BN = await apiWrapper.getRevealingPeriod()
    const councilSize: BN = await apiWrapper.getCouncilSize()
    const candidacyLimit: BN = await apiWrapper.getCandidacyLimit()
    const newTermDuration: BN = await apiWrapper.getNewTermDuration()
    const minCouncilStake: BN = await apiWrapper.getMinCouncilStake()
    const minVotingStake: BN = await apiWrapper.getMinVotingStake()

    // Proposal stake calculation
    const proposalStake: BN = new BN(200000)
    const proposalFee: BN = apiWrapper.estimateProposeElectionParametersFee(
      description,
      description,
      proposalStake,
      announcingPeriod,
      votingPeriod,
      revealingPeriod,
      councilSize,
      candidacyLimit,
      newTermDuration,
      minCouncilStake,
      minVotingStake
    )
    await apiWrapper.transferBalance(sudo, m1KeyPairs[0].address, proposalFee.add(proposalStake))

    // Proposal creation
    const proposedAnnouncingPeriod: BN = announcingPeriod.subn(1)
    const proposedVotingPeriod: BN = votingPeriod.addn(1)
    const proposedRevealingPeriod: BN = revealingPeriod.addn(1)
    const proposedCouncilSize: BN = councilSize.addn(1)
    const proposedCandidacyLimit: BN = candidacyLimit.addn(1)
    const proposedNewTermDuration: BN = newTermDuration.addn(1)
    const proposedMinCouncilStake: BN = minCouncilStake.addn(1)
    const proposedMinVotingStake: BN = minVotingStake.addn(1)
    const proposalPromise = apiWrapper.expectProposalCreated()
    await apiWrapper.proposeElectionParameters(
      m1KeyPairs[0],
      proposalTitle,
      description,
      proposalStake,
      proposedAnnouncingPeriod,
      proposedVotingPeriod,
      proposedRevealingPeriod,
      proposedCouncilSize,
      proposedCandidacyLimit,
      proposedNewTermDuration,
      proposedMinCouncilStake,
      proposedMinVotingStake
    )
    const proposalNumber = await proposalPromise

    // Approving the proposal
    const proposalExecutionPromise = apiWrapper.expectProposalFinalized()
    await apiWrapper.batchApproveProposal(m2KeyPairs, proposalNumber)
    await proposalExecutionPromise

    // Assertions
    const newAnnouncingPeriod: BN = await apiWrapper.getAnnouncingPeriod()
    const newVotingPeriod: BN = await apiWrapper.getVotingPeriod()
    const newRevealingPeriod: BN = await apiWrapper.getRevealingPeriod()
    const newCouncilSize: BN = await apiWrapper.getCouncilSize()
    const newCandidacyLimit: BN = await apiWrapper.getCandidacyLimit()
    const newNewTermDuration: BN = await apiWrapper.getNewTermDuration()
    const newMinCouncilStake: BN = await apiWrapper.getMinCouncilStake()
    const newMinVotingStake: BN = await apiWrapper.getMinVotingStake()
    assert(
      proposedAnnouncingPeriod.eq(newAnnouncingPeriod),
      `Announcing period has unexpected value ${newAnnouncingPeriod}, expected ${proposedAnnouncingPeriod}`
    )
    assert(
      proposedVotingPeriod.eq(newVotingPeriod),
      `Voting period has unexpected value ${newVotingPeriod}, expected ${proposedVotingPeriod}`
    )
    assert(
      proposedRevealingPeriod.eq(newRevealingPeriod),
      `Revealing has unexpected value ${newRevealingPeriod}, expected ${proposedRevealingPeriod}`
    )
    assert(
      proposedCouncilSize.eq(newCouncilSize),
      `Council size has unexpected value ${newCouncilSize}, expected ${proposedCouncilSize}`
    )
    assert(
      proposedCandidacyLimit.eq(newCandidacyLimit),
      `Candidacy limit has unexpected value ${newCandidacyLimit}, expected ${proposedCandidacyLimit}`
    )
    assert(
      proposedNewTermDuration.eq(newNewTermDuration),
      `New term duration has unexpected value ${newNewTermDuration}, expected ${proposedNewTermDuration}`
    )
    assert(
      proposedMinCouncilStake.eq(newMinCouncilStake),
      `Min council stake has unexpected value ${newMinCouncilStake}, expected ${proposedMinCouncilStake}`
    )
    assert(
      proposedMinVotingStake.eq(newMinVotingStake),
      `Min voting stake has unexpected value ${newMinVotingStake}, expected ${proposedMinVotingStake}`
    )
  })
}
