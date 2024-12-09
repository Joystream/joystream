use super::initial_test_ext;
use crate::constants::{currency::DOLLARS, fees::WeightToFee as WeightToFeeImpl};
use crate::ExtrinsicBaseWeight;
use crate::Runtime;
use crate::TransactionByteFee;
use crate::MAXIMUM_BLOCK_WEIGHT;
use frame_support::weights::WeightToFee;
use pallet_transaction_payment::Pallet as TransactionPayment;

#[test]
// This tests that the fee for an standard runtime upgrade is as we expect if it pays fee
// Note: we expect an average runtime upgrade to have a length of ~3MB
fn runtime_upgrade_total_fee_is_correct() {
    // We expect the total fee to be maximum block weight fee +
    // byte fee + base weight fee
    initial_test_ext().execute_with(|| {
        let tx_length_bytes = 3_000_000u32;
        let dispatch_info = frame_support::dispatch::DispatchInfo {
            weight: MAXIMUM_BLOCK_WEIGHT,
            class: frame_support::dispatch::DispatchClass::Operational,
            pays_fee: frame_support::dispatch::Pays::Yes,
        };
        let x = TransactionPayment::<Runtime>::compute_fee(tx_length_bytes, &dispatch_info, 0);
        let weight_fee = WeightToFeeImpl::weight_to_fee(&MAXIMUM_BLOCK_WEIGHT);
        let length_fee = TransactionByteFee::get().saturating_mul(tx_length_bytes as u128);
        let base_weight_fee = WeightToFeeImpl::weight_to_fee(&ExtrinsicBaseWeight::get());
        let y = weight_fee
            .saturating_add(length_fee)
            .saturating_add(base_weight_fee);

        assert!(x.max(y) - x.min(y) <= 1, "Inaccurate fee estimation");

        assert!(y.lt(&DOLLARS.saturating_mul(80)));
        // assert!(y.gt(&DOLLARS.saturating_mul(77)));
    });
}
