import { KeyringPair } from '@polkadot/keyring/types'
import { ApiWrapper } from '../../utils/apiWrapper'
import { WsProvider, Keyring } from '@polkadot/api'
import BN from 'bn.js'
import { registerJoystreamTypes, Seat } from '@rome/types'
import { assert } from 'chai'
import { v4 as uuid } from 'uuid'
import { Utils } from '../../utils/utils'
import tap from 'tap'

export function councilTest(
  m1KeyPairs: KeyringPair[],
  m2KeyPairs: KeyringPair[],
  keyring: Keyring,
  k: number,
  nodeUrl: string,
  sudoUri: string,
  greaterStake: BN,
  lesserStake: BN
) {
  let sudo: KeyringPair
  let apiWrapper: ApiWrapper

  tap.test('Electing council test setup', async () => {
    registerJoystreamTypes()
    const provider = new WsProvider(nodeUrl)
    apiWrapper = await ApiWrapper.create(provider)
  })

  tap.test('Electing a council test', async () => {
    // Setup goes here because M keypairs are generated after before() function
    sudo = keyring.addFromUri(sudoUri)
    let now = await apiWrapper.getBestBlock()
    const applyForCouncilFee: BN = apiWrapper.estimateApplyForCouncilFee(greaterStake)
    const voteForCouncilFee: BN = apiWrapper.estimateVoteForCouncilFee(sudo.address, sudo.address, greaterStake)
    const salt: string[] = []
    m1KeyPairs.forEach(() => {
      salt.push(''.concat(uuid().replace(/-/g, '')))
    })
    const revealVoteFee: BN = apiWrapper.estimateRevealVoteFee(sudo.address, salt[0])

    // Topping the balances
    await apiWrapper.transferBalanceToAccounts(sudo, m2KeyPairs, applyForCouncilFee.add(greaterStake))
    await apiWrapper.transferBalanceToAccounts(sudo, m1KeyPairs, voteForCouncilFee.add(revealVoteFee).add(greaterStake))

    // First K members stake more
    await apiWrapper.sudoStartAnnouncingPerion(sudo, now.addn(100))
    await apiWrapper.batchApplyForCouncilElection(m2KeyPairs.slice(0, k), greaterStake)
    m2KeyPairs.slice(0, k).forEach((keyPair) =>
      apiWrapper.getCouncilElectionStake(keyPair.address).then((stake) => {
        assert(
          stake.eq(greaterStake),
          `${keyPair.address} not applied correctrly for council election with stake ${stake} versus expected ${greaterStake}`
        )
      })
    )

    // Last members stake less
    await apiWrapper.batchApplyForCouncilElection(m2KeyPairs.slice(k), lesserStake)
    m2KeyPairs.slice(k).forEach((keyPair) =>
      apiWrapper.getCouncilElectionStake(keyPair.address).then((stake) => {
        assert(
          stake.eq(lesserStake),
          `${keyPair.address} not applied correctrly for council election with stake ${stake} versus expected ${lesserStake}`
        )
      })
    )

    // Voting
    await apiWrapper.sudoStartVotingPerion(sudo, now.addn(100))
    await apiWrapper.batchVoteForCouncilMember(
      m1KeyPairs.slice(0, k),
      m2KeyPairs.slice(0, k),
      salt.slice(0, k),
      lesserStake
    )
    await apiWrapper.batchVoteForCouncilMember(m1KeyPairs.slice(k), m2KeyPairs.slice(k), salt.slice(k), greaterStake)

    // Revealing
    await apiWrapper.sudoStartRevealingPerion(sudo, now.addn(100))
    await apiWrapper.batchRevealVote(m1KeyPairs.slice(0, k), m2KeyPairs.slice(0, k), salt.slice(0, k))
    await apiWrapper.batchRevealVote(m1KeyPairs.slice(k), m2KeyPairs.slice(k), salt.slice(k))
    now = await apiWrapper.getBestBlock()

    // Resolving election
    // 3 is to ensure the revealing block is in future
    await apiWrapper.sudoStartRevealingPerion(sudo, now.addn(3))
    await Utils.wait(apiWrapper.getBlockDuration().muln(2.5).toNumber())
    const seats: Seat[] = await apiWrapper.getCouncil()

    // Preparing collections to increase assertion readability
    const m2addresses: string[] = m2KeyPairs.map((keyPair) => keyPair.address)
    const m1addresses: string[] = m1KeyPairs.map((keyPair) => keyPair.address)
    const members: string[] = seats.map((seat) => seat.member.toString())
    const bakers: string[] = seats.map((seat) => seat.backers.map((baker) => baker.member.toString())).flat()

    // Assertions
    m2addresses.forEach((address) => assert(members.includes(address), `Account ${address} is not in the council`))
    m1addresses.forEach((address) => assert(bakers.includes(address), `Account ${address} is not in the voters`))
    seats.forEach((seat) =>
      assert(
        Utils.getTotalStake(seat).eq(greaterStake.add(lesserStake)),
        `Member ${seat.member} has unexpected stake ${Utils.getTotalStake(seat)}`
      )
    )
  })

  tap.teardown(() => {
    apiWrapper.close()
  })
}
