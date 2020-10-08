import { KeyringPair } from '@polkadot/keyring/types'
import { Keyring } from '@polkadot/api'
import { Api } from '../../Api'
import { TextProposalFixture } from '../../fixtures/proposalsModule'
import { DbService } from '../../DbService'

export default async function textProposal(api: Api, env: NodeJS.ProcessEnv, db: DbService) {
  const sudoUri: string = env.SUDO_ACCOUNT_URI!
  const keyring = new Keyring({ type: 'sr25519' })
  const sudo: KeyringPair = keyring.addFromUri(sudoUri)

  // Pre-conditions: members and council
  const m1KeyPairs = db.getMembers()
  const m2KeyPairs = db.getCouncil()

  const textProposalFixture: TextProposalFixture = new TextProposalFixture(api, m1KeyPairs, m2KeyPairs, sudo)
  await textProposalFixture.runner(false)
}
