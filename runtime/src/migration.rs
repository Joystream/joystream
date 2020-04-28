use crate::VERSION;
use common::currency::BalanceOf;
use rstd::prelude::*;
use sr_primitives::{print, traits::Zero};
use srml_support::{debug, decl_event, decl_module, decl_storage};
use system;

impl<T: Trait> Module<T> {
    /// This method is called from on_initialize() when a runtime upgrade is detected. This
    /// happens when the runtime spec version is found to be higher than the stored value.
    /// Important to note this method should be carefully maintained, because it runs on every runtime
    /// upgrade.
    fn runtime_upgraded() {
        print("Running runtime upgraded handler");

        // Add initialization of modules introduced in new runtime release. Typically this
        // would be any new storage values that need an initial value which would not
        // have been initialized with config() or build() chainspec construction mechanism.
        // Other tasks like resetting values, migrating values etc.

        // Runtime Upgrade Code for going from Rome to Constantinople

        // Create the Council mint. If it fails, we can't do anything about it here.
        governance::council::Module::<T>::create_new_council_mint(minting::BalanceOf::<T>::zero())
            .err()
            .map(|err| {
                debug::warn!(
                    "Failed to create a mint for council during migration: {:?}",
                    err
                );
            });

        // Reset Council
        governance::election::Module::<T>::stop_election_and_dissolve_council()
            .err()
            .map(|err| {
                debug::warn!("Failed to dissolve council during migration: {:?}", err);
            });

        // Reset working group mint capacity
        content_working_group::Module::<T>::set_mint_capacity(
            system::RawOrigin::Root.into(),
            minting::BalanceOf::<T>::zero(),
        )
        .err()
        .map(|err| {
            debug::warn!(
                "Failed to reset mint for working group during migration: {:?}",
                err
            );
        });

        // Deactivate active curators
        let termination_reason = "resetting curators".as_bytes().to_vec();

        for (curator_id, ref curator) in content_working_group::CuratorById::<T>::enumerate() {
            // Skip non-active curators
            if curator.stage != content_working_group::CuratorRoleStage::Active {
                continue;
            }

            content_working_group::Module::<T>::terminate_curator_role_as_root(
                system::RawOrigin::Root.into(),
                curator_id,
                termination_reason.clone(),
            )
            .err()
            .map(|err| {
                debug::warn!(
                    "Failed to terminate curator {:?} during migration: {:?}",
                    curator_id,
                    err
                );
            });
        }

        // Deactivate all storage providers, except Joystream providers (member id 0 in Rome runtime)
        let joystream_providers =
            roles::actors::AccountIdsByMemberId::<T>::get(T::MemberId::from(0));

        // Is there an intersect() like call to check if vector contains some elements from
        // another vector?.. below implementation just seems
        // silly to have to do in a filter predicate.
        let storage_providers_to_remove: Vec<T::AccountId> =
            roles::actors::Module::<T>::actor_account_ids()
                .into_iter()
                .filter(|account| {
                    for provider in joystream_providers.as_slice() {
                        if *account == *provider {
                            return false;
                        }
                    }
                    return true;
                })
                .collect();

        for provider in storage_providers_to_remove {
            roles::actors::Module::<T>::remove_actor(system::RawOrigin::Root.into(), provider)
                .err()
                .map(|err| {
                    debug::warn!(
                        "Failed to remove storage provider during migration: {:?}",
                        err
                    );
                });
        }

        // Remove any pending storage entry requests, no stake is lost because only a fee is paid
        // to make a request.
        let no_requests: roles::actors::Requests<T> = vec![];
        roles::actors::RoleEntryRequests::<T>::put(no_requests);

        // Set Storage Role reward to zero
        if let Some(parameters) =
            roles::actors::Parameters::<T>::get(roles::actors::Role::StorageProvider)
        {
            roles::actors::Module::<T>::set_role_parameters(
                system::RawOrigin::Root.into(),
                roles::actors::Role::StorageProvider,
                roles::actors::RoleParameters {
                    reward: BalanceOf::<T>::zero(),
                    ..parameters
                },
            )
            .err()
            .map(|err| {
                debug::warn!(
                    "Failed to set zero reward for storage role during migration: {:?}",
                    err
                );
            });
        }
        proposals_codex::Module::<T>::set_default_config_values();

        Self::deposit_event(RawEvent::Migrated(
            <system::Module<T>>::block_number(),
            VERSION.spec_version,
        ));
    }
}

pub trait Trait:
    system::Trait + governance::election::Trait + content_working_group::Trait + roles::actors::Trait + proposals_codex::Trait
{
    type Event: From<Event<Self>> + Into<<Self as system::Trait>::Event>;
}

decl_storage! {
    trait Store for Module<T: Trait> as Migration {
        /// Records at what runtime spec version the store was initialized. At genesis this will be
        /// initialized to Some(VERSION.spec_version). It is an Option because the first time the module
        /// was introduced was as a runtime upgrade and type was never changed.
        /// When the runtime is upgraded the spec version be updated.
        pub SpecVersion get(spec_version) build(|_config: &GenesisConfig| {
            VERSION.spec_version
        }) : Option<u32>;
    }
}

decl_event! {
    pub enum Event<T> where <T as system::Trait>::BlockNumber {
        Migrated(BlockNumber, u32),
    }
}

decl_module! {
    pub struct Module<T: Trait> for enum Call where origin: T::Origin {
        fn deposit_event() = default;

        fn on_initialize(_now: T::BlockNumber) {
            if Self::spec_version().map_or(true, |spec_version| VERSION.spec_version > spec_version) {
                // Mark store version with current version of the runtime
                SpecVersion::put(VERSION.spec_version);

                // Run migrations and store initializers
                Self::runtime_upgraded();

                Self::deposit_event(RawEvent::Migrated(
                    <system::Module<T>>::block_number(),
                    VERSION.spec_version,
                ));
            }
        }
    }
}
