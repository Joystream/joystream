import { KeyringPair } from '@polkadot/keyring/types'
import { Keyring } from '@polkadot/api'
import BN from 'bn.js'
import { Api } from '../../Api'
import { SpendingProposalFixture } from '../../fixtures/proposalsModule'
import { DbService } from '../../DbService'

export default async function spendingProposal(api: Api, env: NodeJS.ProcessEnv, db: DbService) {
  const sudoUri: string = env.SUDO_ACCOUNT_URI!
  const keyring = new Keyring({ type: 'sr25519' })
  const sudo: KeyringPair = keyring.addFromUri(sudoUri)

  const spendingBalance: BN = new BN(+env.SPENDING_BALANCE!)
  const mintCapacity: BN = new BN(+env.COUNCIL_MINTING_CAPACITY!)

  // Pre-conditions, members and council
  const m1KeyPairs = db.getMembers()
  const m2KeyPairs = db.getCouncil()

  const spendingProposalFixture: SpendingProposalFixture = new SpendingProposalFixture(
    api,
    m1KeyPairs,
    m2KeyPairs,
    sudo,
    spendingBalance,
    mintCapacity
  )
  // Spending proposal test
  await spendingProposalFixture.runner(false)
}
