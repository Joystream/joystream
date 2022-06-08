use sp_runtime::traits::Convert;

/// A structure that converts the currency type into a lossy u64
/// And back from u128
pub struct CurrencyToVoteHandler;

impl Convert<u128, u64> for CurrencyToVoteHandler {
    fn convert(x: u128) -> u64 {
        if x >> 96 == 0 {
            x as u64
        } else {
            u64::max_value()
        }
    }
}

impl Convert<u128, u128> for CurrencyToVoteHandler {
    fn convert(x: u128) -> u128 {
        // if it practically fits in u64
        if x >> 64 == 0 {
            x
        } else {
            // 0000_0000_FFFF_FFFF_FFFF_FFFF_0000_0000
            u64::max_value() as u128
        }
    }
}
