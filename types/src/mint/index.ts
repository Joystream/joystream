import { u32, u64, u128, Option } from '@polkadot/types'
import { Balance, BlockNumber } from '@polkadot/types/interfaces'
import { JoyEnum, JoyStructDecorated } from '../common'
import { RegistryTypes } from '@polkadot/types/types'

export class MintId extends u64 {}

export class Setting extends u128 {}
export class Adding extends u128 {}
export class Reducing extends u128 {}

export class AdjustCapacityBy extends JoyEnum({ Setting, Adding, Reducing } as const) {}

export type IAdjustOnInterval = {
  block_interval: BlockNumber
  adjustment_type: AdjustCapacityBy
}
export class AdjustOnInterval
  extends JoyStructDecorated({
    block_interval: u32,
    adjustment_type: AdjustCapacityBy,
  })
  implements IAdjustOnInterval {}

export type INextAdjustment = {
  adjustment: AdjustOnInterval
  at_block: BlockNumber
}
export class NextAdjustment
  extends JoyStructDecorated({
    adjustment: AdjustOnInterval,
    at_block: u32,
  })
  implements INextAdjustment {}

export type IMint = {
  capacity: Balance
  next_adjustment: Option<NextAdjustment>
  created_at: BlockNumber
  total_minted: Balance
}
export class Mint
  extends JoyStructDecorated({
    capacity: u128,
    next_adjustment: Option.with(NextAdjustment),
    created_at: u32,
    total_minted: u128,
  })
  implements IMint {}

export const mintTypes: RegistryTypes = {
  MintId: 'u64',
  Mint,
  MintBalanceOf: 'Balance',
  BalanceOfMint: 'Balance',
  'minting::BalanceOf': 'Balance',
  // Expose in registry for api.createType purposes:
  NextAdjustment,
  AdjustOnInterval,
  AdjustCapacityBy,
}
export default mintTypes
