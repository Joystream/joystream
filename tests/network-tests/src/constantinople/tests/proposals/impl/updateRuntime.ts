import { Keyring } from '@polkadot/api'
import { KeyringPair } from '@polkadot/keyring/types'
import { ApiWrapper } from '../../../utils/apiWrapper'
import { v4 as uuid } from 'uuid'
import BN from 'bn.js'
import tap from 'tap'
import { Utils } from '../../../utils/utils'

export function updateRuntimeTest(
  apiWrapper: ApiWrapper,
  m1KeyPairs: KeyringPair[],
  m2KeyPairs: KeyringPair[],
  keyring: Keyring,
  sudoUri: string,
  runtimePath: string
) {
  let sudo: KeyringPair

  tap.test('\n\tUpgrading the runtime test', async () => {
    // Setup
    sudo = keyring.addFromUri(sudoUri)
    const runtime: string = Utils.readRuntimeFromFile(runtimePath)
    const description = 'runtime upgrade proposal which is used for API network testing'
    const runtimeVoteFee: BN = apiWrapper.estimateVoteForProposalFee()

    // Topping the balances
    const proposalStake: BN = new BN(1000000)
    const runtimeProposalFee: BN = apiWrapper.estimateProposeRuntimeUpgradeFee(
      proposalStake,
      description,
      description,
      runtime
    )
    await apiWrapper.transferBalance(sudo, m1KeyPairs[0].address, runtimeProposalFee.add(proposalStake))
    await apiWrapper.transferBalanceToAccounts(sudo, m2KeyPairs, runtimeVoteFee)

    // Proposal creation
    const proposalPromise = apiWrapper.expectProposalCreated()
    await apiWrapper.proposeRuntime(
      m1KeyPairs[0],
      proposalStake,
      'testing runtime' + uuid().substring(0, 8),
      'runtime to test proposal functionality' + uuid().substring(0, 8),
      runtime
    )
    const proposalNumber = await proposalPromise

    // Approving runtime update proposal
    const runtimePromise = apiWrapper.expectProposalFinalized()
    await apiWrapper.batchApproveProposal(m2KeyPairs, proposalNumber)
    await runtimePromise
  })
}
