import { KeyringPair } from '@polkadot/keyring/types'
import { Keyring } from '@polkadot/api'
import BN from 'bn.js'
import { PaidTermId } from '@joystream/types/members'
import { DbService } from '../DbService'

import { Api } from '../Api'
import { Utils } from '../utils'
import { CouncilElectionHappyCaseFixture } from '../fixtures/councilElectionHappyCase'

// Electing council scenario
export default async function councilSetup(api: Api, env: NodeJS.ProcessEnv, db: DbService) {
  const sudoUri: string = env.SUDO_ACCOUNT_URI!
  const keyring = new Keyring({ type: 'sr25519' })
  if (db.hasCouncil()) {
    return
  }

  const sudo: KeyringPair = keyring.addFromUri(sudoUri)

  const N: number = +env.MEMBERSHIP_CREATION_N!
  const m1KeyPairs: KeyringPair[] = Utils.createKeyPairs(keyring, N)
  const m2KeyPairs: KeyringPair[] = Utils.createKeyPairs(keyring, N)
  const paidTerms: PaidTermId = api.createPaidTermId(new BN(+env.MEMBERSHIP_PAID_TERMS!))
  const K: number = +env.COUNCIL_ELECTION_K!
  const greaterStake: BN = new BN(+env.COUNCIL_STAKE_GREATER_AMOUNT!)
  const lesserStake: BN = new BN(+env.COUNCIL_STAKE_LESSER_AMOUNT!)

  // const durationInBlocks = 25
  // setTestTimeout(api, durationInBlocks)

  const councilElectionHappyCaseFixture = new CouncilElectionHappyCaseFixture(
    api,
    sudo,
    m1KeyPairs,
    m2KeyPairs,
    paidTerms,
    K,
    greaterStake,
    lesserStake
  )
  await councilElectionHappyCaseFixture.runner(false)

  db.setMembers(m1KeyPairs)
  db.setCouncil(m2KeyPairs)
}
