import { KeyringPair } from '@polkadot/keyring/types'
import { Keyring } from '@polkadot/api'
import BN from 'bn.js'
import { ApiWrapper } from '../../utils/apiWrapper'
import { Utils } from '../../utils/utils'
import { ValidatorCountProposalFixture } from '../../fixtures/proposalsModule'
import { PaidTermId } from '@joystream/types/members'
import { CouncilElectionHappyCaseFixture } from '../../fixtures/councilElectionHappyCase'
import { DbService } from '../../services/dbService'

export default async function validatorCount(apiWrapper: ApiWrapper, env: NodeJS.ProcessEnv, db: DbService) {
  const sudoUri: string = env.SUDO_ACCOUNT_URI!
  const keyring = new Keyring({ type: 'sr25519' })
  const sudo: KeyringPair = keyring.addFromUri(sudoUri)

  const N: number = +env.MEMBERSHIP_CREATION_N!
  let m1KeyPairs: KeyringPair[] = Utils.createKeyPairs(keyring, N)
  let m2KeyPairs: KeyringPair[] = Utils.createKeyPairs(keyring, N)

  const paidTerms: PaidTermId = apiWrapper.createPaidTermId(new BN(+env.MEMBERSHIP_PAID_TERMS!))
  const K: number = +env.COUNCIL_ELECTION_K!
  const greaterStake: BN = new BN(+env.COUNCIL_STAKE_GREATER_AMOUNT!)
  const lesserStake: BN = new BN(+env.COUNCIL_STAKE_LESSER_AMOUNT!)
  const validatorCountIncrement: BN = new BN(+env.VALIDATOR_COUNT_INCREMENT!)

  // const durationInBlocks = 29
  // setTestTimeout(apiWrapper, durationInBlocks)

  if (db.hasCouncil()) {
    m1KeyPairs = db.getMembers()
    m2KeyPairs = db.getCouncil()
  } else {
    const councilElectionHappyCaseFixture = new CouncilElectionHappyCaseFixture(
      apiWrapper,
      sudo,
      m1KeyPairs,
      m2KeyPairs,
      paidTerms,
      K,
      greaterStake,
      lesserStake
    )
    await councilElectionHappyCaseFixture.runner(false)
  }

  const validatorCountProposalFixture: ValidatorCountProposalFixture = new ValidatorCountProposalFixture(
    apiWrapper,
    m1KeyPairs,
    m2KeyPairs,
    sudo,
    validatorCountIncrement
  )
  await validatorCountProposalFixture.runner(false)
}
