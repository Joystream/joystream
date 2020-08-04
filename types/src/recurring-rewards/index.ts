import { u64, u128, Option, u32 } from '@polkadot/types'
import { Balance, BlockNumber } from '@polkadot/types/interfaces'
import { MintId } from '../mint'
import { JoyStructDecorated } from '../common'
import AccountId from '@polkadot/types/generic/AccountId'
import { RegistryTypes } from '@polkadot/types/types'

export class RecipientId extends u64 {}
export class RewardRelationshipId extends u64 {}

export type IRecipient = {
  total_reward_received: Balance
  total_reward_missed: Balance
}
export class Recipient
  extends JoyStructDecorated({
    total_reward_received: u128,
    total_reward_missed: u128,
  })
  implements IRecipient {}

export type IRewardRelationship = {
  recipient: RecipientId
  mint_id: MintId
  account: AccountId
  amount_per_payout: Balance
  next_payment_at_block: Option<BlockNumber>
  payout_interval: Option<BlockNumber>
  total_reward_received: Balance
  total_reward_missed: Balance
}
export class RewardRelationship
  extends JoyStructDecorated({
    recipient: RecipientId,
    mint_id: MintId,
    account: AccountId,
    amount_per_payout: u128, // Balance
    next_payment_at_block: Option.with(u32), // BlockNumber
    payout_interval: Option.with(u32), // BlockNumber
    total_reward_received: u128, // Balance
    total_reward_missed: u128, // Balance
  })
  implements IRewardRelationship {}

export const recurringRewardsTypes: RegistryTypes = {
  RecipientId: 'u64',
  RewardRelationshipId: 'u64',
  Recipient,
  RewardRelationship,
}
export default recurringRewardsTypes
