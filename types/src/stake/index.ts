import { getTypeRegistry, u32, u64, u128, Enum, Null, BTreeMap, bool } from '@polkadot/types';
import { JoyStruct } from '../common';
import { BlockNumber, Balance } from '@polkadot/types/interfaces';

export class StakeId extends u64 {};
export class SlashId extends u64 {};

export type ISlash = {
    started_at_block: BlockNumber,
    is_active: bool,
    blocks_remaining_in_active_period_for_slashing: BlockNumber,
    slash_amount: Balance,
};
export class Slash extends JoyStruct<ISlash> {
    constructor (value?: ISlash) {
        super({
            started_at_block: u32,
            is_active: bool,
            blocks_remaining_in_active_period_for_slashing: u32,
            slash_amount: u128,
        }, value);
    }
};

export type IUnstakingState = {
    started_at_block: BlockNumber,
    is_active: bool,
    blocks_remaining_in_active_period_for_unstaking: BlockNumber,
};
export class UnstakingState extends JoyStruct<IUnstakingState> {
    constructor (value?: IUnstakingState) {
        super({
            started_at_block: u32,
            is_active: bool,
            blocks_remaining_in_active_period_for_unstaking: u32,
        }, value);
    }
};

export class Normal extends Null {};
export class Unstaking extends UnstakingState {};
export class StakedStatus extends Enum {
    constructor (value?: any, index?: number) {
        super(
          {
            Normal,
            Unstaking
          },
          value, index);
    }
};

export type IStakedState = {
    staked_amount: Balance,
    staked_status: StakedStatus,
    next_slash_id: SlashId,
    ongoing_slashes: BTreeMap<SlashId, Slash>,
};
export class StakedState extends JoyStruct<IStakedState> {
    constructor (value?: IStakedState) {
        super({
            staked_amount: u128,
            staked_status: StakedStatus,
            next_slash_id: SlashId,
            ongoing_slashes: BTreeMap.with(SlashId, Slash),
        }, value);
    }

    get staked_amount(): u128 {
      return this.getField<u128>('staked_amount')
    }
};

export class NotStaked extends Null {};
export class Staked extends StakedState {};

export class StakingStatus extends Enum {
    constructor (value?: any, index?: number) {
        super(
          {
            NotStaked,
            Staked,
          },
          value, index);
    }
};

export type IStake = {
    created: BlockNumber,
    staking_status: StakingStatus
};

export class Stake extends JoyStruct<IStake> {
    constructor (value?: IStake) {
        super({
            created: u32,
            staking_status: StakingStatus
        }, value);
    }

    get created(): u32 {
      return this.getField<u32>('created')
    }

    get staking_status(): StakingStatus {
      return this.getField<StakingStatus>('staking_status')
    }

    get value(): Balance {
      switch (this.staking_status.type) {
        case "Staked":
          return (this.staking_status.value as Staked).staked_amount
      }

      return new u128(0)
    }
}

export function registerStakeTypes () {
    try {
      getTypeRegistry().register({
        StakeId: 'u64',
        Stake,
      });
    } catch (err) {
      console.error('Failed to register custom types of stake module', err);
    }
}
