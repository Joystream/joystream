use sp_runtime::traits::{Convert, SaturatedConversion};

/// A structure that converts the currency type into a lossy u64
/// And back from u128
pub struct CurrencyToVoteHandler;

impl Convert<u128, u64> for CurrencyToVoteHandler {
    fn convert(x: u128) -> u64 {
        x.saturated_into()
    }
}

impl Convert<u128, u128> for CurrencyToVoteHandler {
    fn convert(x: u128) -> u128 {
        let as_saturated_u64: u64 = x.saturated_into();
        as_saturated_u64.into()
    }
}
