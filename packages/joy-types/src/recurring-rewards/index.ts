import { getTypeRegistry, u32, u64, u128, Option, GenericAccountId } from '@polkadot/types';
import { AccountId, Balance, BlockNumber } from '@polkadot/types/interfaces';
import { JoyStruct } from '../JoyStruct';
import { MintId } from '../mint';

export class RecipientId extends u64 {};
export class RewardRelationshipId extends u64 {};

export type IRecipient = {
  total_reward_received: Balance,
  total_reward_missed: Balance,
};
export class Recipient extends JoyStruct<IRecipient> {
  constructor (value?: IRecipient) {
    super({
      total_reward_received: u128,
      total_reward_missed: u128,
    }, value);
  }

  get total_reward_received(): u128 {
    return this.getField<u128>('total_reward_received')
  }

  get total_reward_missed(): u128 {
    return this.getField<u128>('total_reward_missed')
  }
};

export type IRewardRelationship = {
  recipient: RecipientId,
  mint_id: MintId,
  account: AccountId,
  amount_per_payout: Balance,
  next_payment_at_block: Option<BlockNumber>,
  payout_interval: Option<BlockNumber>,
  total_reward_received: Balance,
  total_reward_missed: Balance,
};
export class RewardRelationship extends JoyStruct<IRewardRelationship> {
  constructor (value?: IRecipient) {
    super({
      recipient: RecipientId,
      mint_id: MintId,
      account: GenericAccountId,
      amount_per_payout: u128,
      next_payment_at_block: Option.with(u32),
      payout_interval: Option.with(u32),
      total_reward_received: u128,
      total_reward_missed: u128,
    }, value);
  }

  get recipient(): RecipientId {
    return this.getField<RecipientId>('recipient')
  }
};

export function registerRecurringRewardsTypes () {
    try {
      getTypeRegistry().register({
        RecipientId: 'u64',
        RewardRelationshipId: 'u64',
        Recipient,
        RewardRelationship
      });
    } catch (err) {
      console.error('Failed to register custom types of recurring rewards module', err);
    }
}
