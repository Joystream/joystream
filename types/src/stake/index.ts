import { u32, u64, u128, Null, BTreeMap, bool } from '@polkadot/types'
import { BlockNumber, Balance } from '@polkadot/types/interfaces'
import { RegistryTypes } from '@polkadot/types/types'
import { JoyEnum, JoyStructDecorated } from '../common'

export class StakeId extends u64 {}
export class SlashId extends u64 {}

export type ISlash = {
  started_at_block: BlockNumber
  is_active: bool
  blocks_remaining_in_active_period_for_slashing: BlockNumber
  slash_amount: Balance
}
export class Slash
  extends JoyStructDecorated({
    started_at_block: u32,
    is_active: bool,
    blocks_remaining_in_active_period_for_slashing: u32,
    slash_amount: u128,
  })
  implements ISlash {}

export type IUnstakingState = {
  started_at_block: BlockNumber
  is_active: bool
  blocks_remaining_in_active_period_for_unstaking: BlockNumber
}
export class UnstakingState
  extends JoyStructDecorated({
    started_at_block: u32,
    is_active: bool,
    blocks_remaining_in_active_period_for_unstaking: u32,
  })
  implements IUnstakingState {}

export class Normal extends Null {}
export class Unstaking extends UnstakingState {}
export class StakedStatus extends JoyEnum({
  Normal,
  Unstaking,
} as const) {}

export type IStakedState = {
  staked_amount: Balance
  staked_status: StakedStatus
  next_slash_id: SlashId
  ongoing_slashes: BTreeMap<SlashId, Slash>
}
export class StakedState
  extends JoyStructDecorated({
    staked_amount: u128,
    staked_status: StakedStatus,
    next_slash_id: SlashId,
    ongoing_slashes: BTreeMap.with(SlashId, Slash),
  })
  implements IStakedState {}

export class NotStaked extends Null {}
export class Staked extends StakedState {}

export class StakingStatus extends JoyEnum({
  NotStaked,
  Staked,
} as const) {}

export type IStake = {
  created: BlockNumber
  staking_status: StakingStatus
}

export class Stake
  extends JoyStructDecorated({
    created: u32,
    staking_status: StakingStatus,
  })
  implements IStake {
  get value(): Balance {
    if (this.staking_status.isOfType('Staked')) {
      return this.staking_status.asType('Staked').staked_amount
    }

    return new u128(this.registry, 0)
  }
}

export const stakeTypes: RegistryTypes = {
  StakeId: 'u64',
  Stake,
  // Expose in registry for api.createType purposes:
  StakingStatus,
  Staked,
  StakedStatus,
  Unstaking,
  Slash,
}
export default stakeTypes
