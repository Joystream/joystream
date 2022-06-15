import { Vec, Option, BTreeMap, Tuple, UInt } from '@polkadot/types'
import { bool, u8, u32, u64, Null } from '@polkadot/types/primitive'
import { JoyStructDecorated, JoyEnum, MemberId, Balance, Hash, BlockNumber, AccountId } from '../common'
import { DataObjectCreationParameters, BagId } from '../storage'

export class TokenSaleId extends u32 {}
export class TokenId extends u64 {}
export class JoyBalance extends Balance {}
export class YearlyRate extends UInt.with(32, 'Permill') {}
export class BlockRate extends UInt.with(64, 'Perquintill') {}

export class VestingSource extends JoyEnum({
  InitialIssuance: Null,
  Salet: TokenSaleId,
  IssuerTransfer: u64,
}) {}

export class VestingSchedule extends JoyStructDecorated({
  linear_vesting_start_block: BlockNumber,
  linear_vesting_duration: BlockNumber,
  cliff_amount: Balance,
  post_cliff_total_amount: Balance,
  burned_amount: Balance,
}) {}

export class TransferPolicy extends JoyEnum({
  Permissionless: Null,
  Permissioned: Hash,
}) {}

export class SingleDataObjectUploadParams extends JoyStructDecorated({
  object_creation_params: DataObjectCreationParameters,
  expeted_data_size_fee: JoyBalance,
  expected_data_object_state_bloat_bond: JoyBalance,
}) {}

export class WhitelistParams extends JoyStructDecorated({
  commitment: Hash,
  payload: Option.with(SingleDataObjectUploadParams),
}) {}

export class TransferPolicyParams extends JoyEnum({
  Permissionless: Null,
  Permissioned: WhitelistParams,
}) {}

export class VestingScheduleParams extends JoyStructDecorated({
  linear_vesting_starting_block: BlockNumber,
  linear_vesting_duration: BlockNumber,
  cliff_amount: Balance,
  burned_amount: Balance,
}) {}

export class UploadContent extends JoyStructDecorated({
  upload_account: AccountId,
  bag_id: BagId,
}) {}

export class TokenSaleParams extends JoyStructDecorated({
  unit_price: JoyBalance,
  upper_bound_quantity: Balance,
  starts_at: Option.with(BlockNumber),
  duration: BlockNumber,
  vesting_schedule_params: Option.with(VestingScheduleParams),
  cap_per_member: Option.with(Balance),
  metadata: Option.with(Vec.with(u8)),
}) {}

export class TokenSale extends JoyStructDecorated({
  unit_price: JoyBalance,
  quantity_left: Balance,
  funds_collected: JoyBalance,
  token_source: MemberId,
  earnings_destination: Option.with(AccountId),
  start_block: BlockNumber,
  vesting_schedule_params: Option.with(VestingScheduleParams),
  cap_per_member: Option.with(Balance),
  auto_finalize: bool,
}) {}

export class OfferingState extends JoyEnum({
  Idle: Null,
  UpcomingSale: TokenSale,
  Sale: TokenSale,
  BondingCurve: Null,
}) {}

export class TokenAllocation extends JoyStructDecorated({
  amount: Balance,
  vesting_schedule_params: Option.with(VestingScheduleParams),
}) {}

export class TokenIssuanceParams extends JoyStructDecorated({
  initial_allocation: BTreeMap.with(MemberId, TokenAllocation),
  symbol: Hash,
  transfer_policy: TransferPolicyParams,
  patronage_rate: YearlyRate,
}) {}

export class MerkleSide extends JoyEnum({
  Right: Null,
  Left: Null,
}) {}

export class MerkleProof extends Vec.with(Tuple.with([Hash, MerkleSide])) {}

export class Payment extends JoyStructDecorated({
  remark: Vec.with(u8),
  amount: Balance,
}) {}

export class PaymentWithVesting extends JoyStructDecorated({
  remark: Vec.with(u8),
  amount: Balance,
  vesting_schedule: Option.with(VestingScheduleParams),
}) {}

export class ValidatedPayment extends JoyStructDecorated({
  payment: PaymentWithVesting,
  vesting_cleanup_candidate: Option.with(VestingSource),
}) {}

export const projectTokenTypes = {
  // --- Vesting ------------------------------------
  VestingSource,
  VestingSchedule,
  VestingScheduleParams,
  // --- Sale ---------------------------------------
  TokenSaleId,
  TokenSale,
  TokenSaleParams,
  // --- Token Basics ---------------------------------
  TokenAllocation,
  TokenId,
  TokenIssuanceParams,
  OfferingState,
  JoyBalance,
  // --- Patronage ------------------------------------
  YearlyRate,
  BlockRate,
  // --- Payments ------------------------------------
  Payment,
  PaymentWithVesting,
  MerkleProof,
  MerkleSide,
  ValidatedPayment,
  // --- Transfers ------------------------------------
  TransferPolicy,
  TransferPolicyParams,
  WhitelistParams,
  // --- Storage ---------------------------------------
  UploadContent,
  SingleDataObjectUploadParams,
}

export default projectTokenTypes
