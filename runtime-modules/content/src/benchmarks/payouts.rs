#![cfg(feature = "runtime-benchmarks")]

use crate::types::ChannelOwner;
use crate::Module as Pallet;
use crate::{Call, ChannelById, Config};
use frame_benchmarking::benchmarks;
use frame_support::storage::StorageMap;
use frame_support::traits::Get;
use frame_system::RawOrigin;
use sp_arithmetic::traits::{One, Saturating};

use super::{
    generate_channel_creation_params, insert_distribution_leader, insert_storage_leader,
    member_funded_account, CreateAccountId, DistributionWorkingGroupInstance,
    StorageWorkingGroupInstance, DEFAULT_MEMBER_ID, MAX_COLABORATOR_IDS, MAX_OBJ_NUMBER,
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

    claim_channel_reward {
        // setup
        // 1 channel
        let channel_creation_params = generate_channel_creation_params(
            insert_storage_leader::<T>(),
            insert_distribution_leader::<T>(),
            0,0,0,0,0
        );
)
        // 2 outstanding payment
    }: _ (sender, actor, proof, item)
        verify {

        }
}
