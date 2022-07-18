#![cfg(feature = "runtime-benchmarks")]

use crate::Module as Pallet;
use crate::{Call, Config};
use frame_benchmarking::benchmarks;
use frame_system::RawOrigin;

use super::{
    DistributionWorkingGroupInstance, CreateAccountId,
    StorageWorkingGroupInstance,
};

benchmarks! {
    where_clause {
    where
    T: balances::Config,
    T: membership::Config,
    T: storage::Config,
    T: working_group::Config<StorageWorkingGroupInstance>,
    T: working_group::Config<DistributionWorkingGroupInstance>,
    T::AccountId: CreateAccountId,
    T: Config ,
}

    update_channel_payouts {
        let origin = RawOrigin::Root;
        let params = crate::UpdateChannelPayoutsParametersRecord::<_,_> {
            commitment: None,
            payload: None,
            min_cashout_allowed: None,
            max_cashout_allowed: None,
            channel_cashouts_enabled: None
        };
    }: _ (origin, params)
}


#[cfg(test)]
pub mod tests {
    use crate::tests::mock::{with_default_mock_builder, Content};
    use frame_support::assert_ok;

    #[test]
    fn update_channel_payouts() {
        with_default_mock_builder(|| {
            assert_ok!(Content::test_benchmark_update_channel_payouts());
        });
    }
}
