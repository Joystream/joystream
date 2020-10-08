import { KeyringPair } from '@polkadot/keyring/types'
import { Keyring } from '@polkadot/api'
import BN from 'bn.js'
import { Api } from '../../Api'
import { ValidatorCountProposalFixture } from '../../fixtures/proposalsModule'
import { DbService } from '../../DbService'

export default async function validatorCount(api: Api, env: NodeJS.ProcessEnv, db: DbService) {
  const sudoUri: string = env.SUDO_ACCOUNT_URI!
  const keyring = new Keyring({ type: 'sr25519' })
  const sudo: KeyringPair = keyring.addFromUri(sudoUri)

  const validatorCountIncrement: BN = new BN(+env.VALIDATOR_COUNT_INCREMENT!)

  const m1KeyPairs = db.getMembers()
  const m2KeyPairs = db.getCouncil()

  const validatorCountProposalFixture: ValidatorCountProposalFixture = new ValidatorCountProposalFixture(
    api,
    m1KeyPairs,
    m2KeyPairs,
    sudo,
    validatorCountIncrement
  )
  await validatorCountProposalFixture.runner(false)
}
