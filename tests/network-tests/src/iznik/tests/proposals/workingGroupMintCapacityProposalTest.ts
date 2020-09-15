import { KeyringPair } from '@polkadot/keyring/types'
import { initConfig } from '../../utils/config'
import { Keyring, WsProvider } from '@polkadot/api'
import BN from 'bn.js'
import { setTestTimeout } from '../../utils/setTestTimeout'
import tap from 'tap'
import { closeApi } from '../../utils/closeApi'
import { ApiWrapper, WorkingGroups } from '../../utils/apiWrapper'
import { Utils } from '../../utils/utils'
import { VoteForProposalFixture, WorkingGroupMintCapacityProposalFixture } from '../fixtures/proposalsModule'
import { ExpectMintCapacityChangedFixture } from '../fixtures/workingGroupModule'
import { PaidTermId } from '@alexandria/types/members'
import { ProposalId } from '@alexandria/types/proposals'
import { CouncilElectionHappyCaseFixture } from '../fixtures/councilElectionHappyCase'
import { DbService } from '../../services/dbService'

tap.mocha.describe('Set storage working group mint capacity scenario', async () => {
  initConfig()

  const nodeUrl: string = process.env.NODE_URL!
  const sudoUri: string = process.env.SUDO_ACCOUNT_URI!
  const keyring = new Keyring({ type: 'sr25519' })
  const provider = new WsProvider(nodeUrl)
  const apiWrapper: ApiWrapper = await ApiWrapper.create(provider)
  const sudo: KeyringPair = keyring.addFromUri(sudoUri)
  const db: DbService = DbService.getInstance()

  const N: number = +process.env.MEMBERSHIP_CREATION_N!
  let m1KeyPairs: KeyringPair[] = Utils.createKeyPairs(keyring, N)
  let m2KeyPairs: KeyringPair[] = Utils.createKeyPairs(keyring, N)

  const paidTerms: PaidTermId = apiWrapper.createPaidTermId(new BN(+process.env.MEMBERSHIP_PAID_TERMS!))
  const K: number = +process.env.COUNCIL_ELECTION_K!
  const greaterStake: BN = new BN(+process.env.COUNCIL_STAKE_GREATER_AMOUNT!)
  const lesserStake: BN = new BN(+process.env.COUNCIL_STAKE_LESSER_AMOUNT!)
  const mintCapacityIncrement: BN = new BN(process.env.MINT_CAPACITY_INCREMENT!)
  const durationInBlocks = 30

  setTestTimeout(apiWrapper, durationInBlocks)

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

  const newMintCapacity: BN = (await apiWrapper.getWorkingGroupMintCapacity(WorkingGroups.StorageWorkingGroup)).add(
    mintCapacityIncrement
  )
  const workingGroupMintCapacityProposalFixture: WorkingGroupMintCapacityProposalFixture = new WorkingGroupMintCapacityProposalFixture(
    apiWrapper,
    m1KeyPairs,
    sudo,
    newMintCapacity,
    WorkingGroups.StorageWorkingGroup
  )
  tap.test('Propose mint capacity', async () => await workingGroupMintCapacityProposalFixture.runner(false))

  let voteForProposalFixture: VoteForProposalFixture
  const expectMintCapacityChanged: ExpectMintCapacityChangedFixture = new ExpectMintCapacityChangedFixture(
    apiWrapper,
    newMintCapacity
  )
  tap.test('Approve mint capacity', async () => {
    voteForProposalFixture = new VoteForProposalFixture(
      apiWrapper,
      m2KeyPairs,
      sudo,
      workingGroupMintCapacityProposalFixture.getCreatedProposalId() as ProposalId
    )
    voteForProposalFixture.runner(false)
    await expectMintCapacityChanged.runner(false)
  })

  closeApi(apiWrapper)
})
