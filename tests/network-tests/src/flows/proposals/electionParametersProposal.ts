import { KeyringPair } from '@polkadot/keyring/types'
import { Keyring } from '@polkadot/api'
import { Api } from '../../Api'
import { ElectionParametersProposalFixture } from '../../fixtures/proposalsModule'
import { DbService } from '../../DbService'
import { assert } from 'chai'

// Election parameters proposal scenario
export default async function electionParametersProposal(api: Api, env: NodeJS.ProcessEnv, db: DbService) {
  const sudoUri: string = env.SUDO_ACCOUNT_URI!
  const keyring = new Keyring({ type: 'sr25519' })
  const sudo: KeyringPair = keyring.addFromUri(sudoUri)

  // Pre-Conditions: some members and an elected council
  assert(db.hasCouncil())
  const m1KeyPairs = db.getMembers()
  const m2KeyPairs = db.getCouncil()

  const electionParametersProposalFixture: ElectionParametersProposalFixture = new ElectionParametersProposalFixture(
    api,
    m1KeyPairs,
    m2KeyPairs,
    sudo
  )
  await electionParametersProposalFixture.runner(false)
}
