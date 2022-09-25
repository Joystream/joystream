import { extendDebug } from 'src/Debugger'
import { FixtureRunner } from 'src/Fixture'
import { FlowProps } from 'src/Flow'
import { BondingRestrictedFixture } from 'src/fixtures/staking/BondingRestrictedFixture'
import BN from 'bn.js'
import { assert } from 'chai'

export default async function validatorSet({ api, query, env }: FlowProps): Promise<void> {
  const debug = extendDebug('flow: validator-set')
  debug('started')
  api.enableDebugTxLogs()

  const nAccounts = 10
  const nBlocks = 100
  const bondAmount = new BN(100000)
  const claimingEra = 10

  // create n accounts
  const stakerAccounts = (await api.createKeyPairs(nAccounts)).map(({ key }) => key.address)

  // such accounts becomes stakers
  const bondingResult = await Promise.all(
    stakerAccounts.map(async (account) => {
      const input = {
        stash: account,
        controller: account,
        bondAmount: bondAmount,
      }
      const bondTx = api.tx.staking.bond(input.controller, input.bondAmount, 'Stash')
      const bondingFees = await api.estimateTxFee(bondTx, input.stash)
      await api.treasuryTransferBalance(input.stash, input.bondAmount.add(bondingFees))
      await api.signAndSend(bondTx, input.stash)
    }))

  // wait k = 10 blocks
  await api.untilBlock(nBlocks)

  // attempt to claim payout
  const claimingResult = await Promise.all(
    stakerAccounts.map(async (account) => {
      const claimTx = api.tx.staking.payoutStakers(account, claimingEra)
      const claimFees = await api.estimateTxFee(claimTx, account)
      await api.treasuryTransferBalance(account, claimFees)
      await api.signAndSend(claimTx, account)
    }))

  // each payout (positive number) must be zero iff the sum is zero
  let totalReward: BN = (await Promise.all(stakerAccounts.map((account) => api.getBalance(account)))).reduce(
    (rewardAmount, accumulator: BN) => accumulator.add(new BN(rewardAmount)),
    0
  )
  assert.equal(totalReward, new BN(0))

  // attempt to claim payouts by authorities should be zero
  let authorities = await api.getAuthorities()
  const claimingResultAuthorities = await Promise.all(
    authorities.map(async (account) => {
      const claimTx = api.tx.staking.payoutStakers(account, claimingEra)
      const claimFees = await api.estimateTxFee(claimTx, account)
      await api.treasuryTransferBalance(account, claimFees)
      await api.signAndSend(claimTx, account)
    }))

  let totalRewardAuthorities: BN = (await Promise.all(authorities.map((account) => api.getBalance(account)))).reduce(
    (rewardAmount, accumulator: BN) => accumulator.add(new BN(rewardAmount)),
    0
  )
  assert.equal(totalRewardAuthorities, new BN(0))
}
