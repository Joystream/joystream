import { RewardRelationship } from '@joystream/types/recurring-rewards'
import { formatBalance } from '@polkadot/util'
import { Option } from '@polkadot/types'
import { RewardPolicy } from '@joystream/types/working-group'

export const formatReward = (
  {
    amount_per_payout: amount,
    payout_interval: interval,
    next_payment_at_block: nextPaymentAtBlock,
  }: RewardRelationship | RewardPolicy,
  showNextPaymentBlock = false
): string => {
  const nextPaymentBlock = nextPaymentAtBlock instanceof Option ? nextPaymentAtBlock.unwrapOr(null) : nextPaymentAtBlock

  return (
    `${formatBalance(amount)}${interval.isSome ? ` / ${interval.unwrap().toString()} block(s)` : ''}` +
    (showNextPaymentBlock && nextPaymentBlock ? ` (Next payment: #${nextPaymentBlock.toString()})` : '')
  )
}
