use super::initial_test_ext;
use crate::constants::currency::{CENTS, DOLLARS};
use crate::Runtime;
use crate::MAXIMUM_BLOCK_WEIGHT;
use pallet_transaction_payment::Module as TransactionPayment;

#[test]
// This test that the fee for an standard runtime upgrade is as we expect if it pays fee
// Note: we expect an average runtime upgrade to have a length of ~3MB
fn runtime_upgrade_total_fee_is_correct() {
    // We expect the total fee to be 16 DOLLARS(maximum block weight) + 15 DOLLARS from
    // byte fee + 1/10 CENT from base weight fee
    initial_test_ext().execute_with(|| {
        let dispatch_info = frame_support::weights::DispatchInfo {
            weight: MAXIMUM_BLOCK_WEIGHT,
            class: frame_support::weights::DispatchClass::Operational,
            pays_fee: frame_support::weights::Pays::Yes,
        };
        let x = TransactionPayment::<Runtime>::compute_fee(3_000_000, &dispatch_info, 0);
        let weight_fee = 16 * DOLLARS; // MaximumBlockWeight fee
        let length_fee = 3 * 50 * DOLLARS; // 50 * DOLLARS = 1M
        let base_weight_fee = CENTS / 10;
        let y = weight_fee + length_fee + base_weight_fee;
        assert_eq!(x.max(y) - x.min(y), 0);
    });
}
