import { u32, u128 } from '@polkadot/types'
import { JoyStructDecorated } from './common'

// We only need this type for historic reasons to read old proposal state
// that was related to the now defunct actors module
export class RoleParameters extends JoyStructDecorated({
  min_stake: u128, // Balance,
  min_actors: u32,
  max_actors: u32,
  reward: u128, // Balance,
  reward_period: u32, // BlockNumber,
  bonding_period: u32, // BlockNumber,
  unbonding_period: u32, // BlockNumber,
  min_service_period: u32, // BlockNumber,
  startup_grace_period: u32, // BlockNumber,
  entry_request_fee: u128, // Balance
}) {}

export const rolesTypes = {
  RoleParameters,
}
export default rolesTypes
