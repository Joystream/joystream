import { RewardRelationship } from '@joystream/types/recurring-rewards';
import { formatBalance } from '@polkadot/util';
import { Option } from '@polkadot/types';
import { RewardPolicy } from '@joystream/types/working-group';

export const formatReward = (
  {
    amount_per_payout: amount,
    payout_interval: interval,
    next_payment_at_block
  }: RewardRelationship | RewardPolicy,
  showNextPaymentBlock = false
) => {
  const nextPaymentBlock = (next_payment_at_block instanceof Option)
    ? next_payment_at_block.unwrapOr(null)
    : next_payment_at_block;

  return (
    `${formatBalance(amount)}${interval.isSome ? ` / ${interval.unwrap()} block(s)` : ''}` +
    ((showNextPaymentBlock && nextPaymentBlock) ? ` (Next payment: #${nextPaymentBlock})` : '')
  );
};
