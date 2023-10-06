use super::*;
use frame_support::traits::OnRuntimeUpgrade;

// syntactic sugar for logging.
#[macro_export]
macro_rules! log {
	($level:tt, $patter:expr $(, $values:expr)* $(,)?) => {
		log::$level!(
			target: $crate::LOG_TARGET,
			concat!("[{:?}] 📹 ", $patter), <frame_system::Pallet<T>>::block_number() $(, $values)*
		)
	};
}

pub mod nara {
    use super::*;
    use frame_support::pallet_prelude::*;

    pub struct MigrateToV1<T>(sp_std::marker::PhantomData<T>);
    impl<T: Config> OnRuntimeUpgrade for MigrateToV1<T> {
        #[cfg(feature = "try-runtime")]
        fn pre_upgrade() -> Result<Vec<u8>, &'static str> {
            let onchain = Pallet::<T>::on_chain_storage_version();

            ensure!(onchain < 1, "this migration can be deleted");

            let module_account_id = Module::<T>::module_treasury_account();
            let deposit = T::JoyExistentialDeposit::get();
            let treasury_free_balance = Joy::<T>::free_balance(&module_account_id);

            ensure!(treasury_free_balance >= Joy::<T>::existential_deposit());
            log!(
                info,
                "treasury_free_balance pre migration: {:?}",
                treasury_free_balance
            );
        }

        fn on_runtime_upgrade() -> Weight {
            let onchain = Pallet::<T>::on_chain_storage_version();
            let current = Pallet::<T>::current_storage_version();

            if onchain > 0 {
                return T::DbWeight::get().reads(1);
            }
            let module_account_id = Module::<T>::module_treasury_account();
            let ed = T::JoyExistentialDeposit::get();

            let _ = Joy::<T>::deposit_creating(&module_account_id, ed);

            current.put::<Pallet<T>>();
            <T as frame_system::Config>::BlockWeights::get().max_block
        }

        #[cfg(feature = "try-runtime")]
        fn post_upgrade() -> Result<Vec<u8>, &'static str> {
            let onchain = Pallet::<T>::on_chain_storage_version();

            ensure!(onchain < 1, "this migration can be deleted");

            let module_account_id = Module::<T>::module_treasury_account();
            let deposit = T::JoyExistentialDeposit::get();
            let treasury_free_balance = Joy::<T>::free_balance(&module_account_id);
            ensure!(treasury_free_balance >= Joy::<T>::existential_deposit());
            log!(
                info,
                "treasury_free_balance post migration: {:?}",
                treasury_free_balance
            );

            let next_token_id = Pallet::<T>::next_token_id();
            ensure!(
                next_token_id == One::one(),
                "Next token id is not correctly initialized"
            )
        }
    }
}
