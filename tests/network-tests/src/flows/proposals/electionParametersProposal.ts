import { KeyringPair } from '@polkadot/keyring/types'
import { Keyring } from '@polkadot/api'
import { Api } from '../../Api'
import { Utils } from '../../utils'
import { ElectionParametersProposalFixture } from '../../fixtures/proposalsModule'
import { DbService } from '../../DbService'

// Election parameters proposal scenario
export default async function electionParametersProposal(api: Api, env: NodeJS.ProcessEnv, db: DbService) {
  const sudoUri: string = env.SUDO_ACCOUNT_URI!
  const keyring = new Keyring({ type: 'sr25519' })
  const sudo: KeyringPair = keyring.addFromUri(sudoUri)

  const N: number = +env.MEMBERSHIP_CREATION_N!
  let m1KeyPairs: KeyringPair[] = Utils.createKeyPairs(keyring, N)
  let m2KeyPairs: KeyringPair[] = Utils.createKeyPairs(keyring, N)

  // Pre-Conditions: some members and an elected council
  // if (!db.hasCouncil() { }
  m1KeyPairs = db.getMembers()
  m2KeyPairs = db.getCouncil()

  const electionParametersProposalFixture: ElectionParametersProposalFixture = new ElectionParametersProposalFixture(
    api,
    m1KeyPairs,
    m2KeyPairs,
    sudo
  )
  await electionParametersProposalFixture.runner(false)
}
