import { KeyringPair } from '@polkadot/keyring/types'
import { Keyring } from '@polkadot/api'
import BN from 'bn.js'
import { PaidTermId } from '@joystream/types/members'
import { DbService } from '../DbService'

import { Api } from '../Api'
import { Utils } from '../utils'
import { CouncilElectionHappyCaseFixture } from '../fixtures/councilElectionHappyCase'
import { BuyMembershipHappyCaseFixture } from '../fixtures/membershipModule'

// Electing council scenario
export default async function councilSetup(api: Api, env: NodeJS.ProcessEnv, db: DbService) {
  if (db.hasCouncil()) {
    return
  }

  const sudoUri: string = env.SUDO_ACCOUNT_URI!
  const keyring = new Keyring({ type: 'sr25519' })
  const sudo: KeyringPair = keyring.addFromUri(sudoUri)
  const voters: KeyringPair[] = Utils.createKeyPairs(keyring, 5)
  const applicants: KeyringPair[] = Utils.createKeyPairs(keyring, 8)
  const paidTerms: PaidTermId = api.createPaidTermId(new BN(+env.MEMBERSHIP_PAID_TERMS!))
  const K: number = +env.COUNCIL_ELECTION_K!
  const greaterStake: BN = new BN(+env.COUNCIL_STAKE_GREATER_AMOUNT!)
  const lesserStake: BN = new BN(+env.COUNCIL_STAKE_LESSER_AMOUNT!)

  const createMembersFixture = new BuyMembershipHappyCaseFixture(api, sudo, [...voters, ...applicants], paidTerms)
  await createMembersFixture.runner(false)

  // The fixture moves manually with sudo the election stages, so proper processing
  // that normally occurs during stage transitions does not happen. This can lead to a council
  // that is smaller than the council size if not enough members apply.
  const councilElectionHappyCaseFixture = new CouncilElectionHappyCaseFixture(
    api,
    sudo,
    voters,
    applicants,
    K,
    greaterStake,
    lesserStake
  )
  await councilElectionHappyCaseFixture.runner(false)

  db.setMembers([...voters, ...applicants])

  const councilMemberAddresses = (await api.getCouncil()).map((seat) => seat.member.toString())
  const councilKeyPairs = applicants.filter((keyPair) => councilMemberAddresses.includes(keyPair.address))
  db.setCouncil(councilKeyPairs)
}
