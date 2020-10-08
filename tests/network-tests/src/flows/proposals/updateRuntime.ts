import { KeyringPair } from '@polkadot/keyring/types'
import { Keyring } from '@polkadot/api'
import BN from 'bn.js'
import { Api } from '../../Api'
import { Utils } from '../../utils'
import { BuyMembershipHappyCaseFixture } from '../../fixtures/membershipModule'
import { UpdateRuntimeFixture } from '../../fixtures/proposalsModule'
import { PaidTermId } from '@joystream/types/members'
import { DbService } from '../../DbService'

export default async function updateRuntime(api: Api, env: NodeJS.ProcessEnv, db: DbService) {
  const sudoUri: string = env.SUDO_ACCOUNT_URI!
  const keyring = new Keyring({ type: 'sr25519' })
  const sudo: KeyringPair = keyring.addFromUri(sudoUri)

  const N: number = +env.MEMBERSHIP_CREATION_N!
  const paidTerms: PaidTermId = api.createPaidTermId(new BN(+env.MEMBERSHIP_PAID_TERMS!))
  const runtimePath: string = env.RUNTIME_WASM_PATH!

  // Pre-conditions: members and council
  const m1KeyPairs = db.getMembers()
  const m2KeyPairs = db.getCouncil()

  const updateRuntimeFixture: UpdateRuntimeFixture = new UpdateRuntimeFixture(
    api,
    m1KeyPairs,
    m2KeyPairs,
    sudo,
    runtimePath
  )
  await updateRuntimeFixture.runner(false)

  // Some tests after runtime update
  const thirdMemberSetFixture: BuyMembershipHappyCaseFixture = new BuyMembershipHappyCaseFixture(
    api,
    sudo,
    Utils.createKeyPairs(keyring, N),
    paidTerms
  )
  await thirdMemberSetFixture.runner(false)
}
