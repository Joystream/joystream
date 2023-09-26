// Migrations for Content Pallet

use super::*;
use frame_support::{parameter_types, traits::OnRuntimeUpgrade, BoundedBTreeMap, BoundedBTreeSet};

#[cfg(feature = "try-runtime")]
use frame_support::ensure;

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

    // Proc macro (EnumIter) clippy::integer_arithmetic disable hack
    #[allow(clippy::integer_arithmetic)]
    mod iterable_enums {
        use super::PausableChannelFeature;
        use codec::{Decode, Encode, MaxEncodedLen};
        use scale_info::TypeInfo;
        use varaint_count::VariantCount;
        #[derive(
            Encode,
            Decode,
            Clone,
            PartialEq,
            Eq,
            Debug,
            PartialOrd,
            Ord,
            TypeInfo,
            VariantCount,
            MaxEncodedLen,
        )]
        pub enum ContentModerationActionV0 {
            HideVideo,
            HideChannel,
            ChangeChannelFeatureStatus(PausableChannelFeature),
            DeleteVideo,
            DeleteChannel,
            DeleteVideoAssets(bool),
            DeleteNonVideoChannelAssets,
            UpdateChannelNftLimits,
        }
    }
    parameter_types! {
        MaxCuratorPermissionsPerLevelV0: u32 = (iterable_enums::ContentModerationActionV0::VARIANT_COUNT as u32)
            // ChangeChannelFeatureStatus can contain all possible PausableChannelFeature variants
            .saturating_add((PausableChannelFeature::VARIANT_COUNT as u32).saturating_sub(1))
            // DeleteVideoAssets can contain `true` or `false`
            .saturating_add(1);
    }

    #[derive(Encode, Decode, Eq, PartialEq, Clone, Debug, TypeInfo, MaxEncodedLen)]
    struct CuratorGroupRecordV0<CuratorGroupCuratorsMap, ModerationPermissionsByLevel> {
        /// Map from CuratorId to curator's ChannelAgentPermissions
        pub curators: CuratorGroupCuratorsMap,

        /// When `false`, curator in a given group is forbidden to act
        pub active: bool,

        // Group's moderation permissions (by channel's privilage level)
        pub permissions_by_level: ModerationPermissionsByLevel,
    }

    type CuratorGroupV0<T> =
        CuratorGroupRecordV0<CuratorGroupCuratorsMap<T>, StoredModerationPermissionsByLevelV0<T>>;

    type StoredCuratorModerationPermissionsV0 =
        BoundedBTreeSet<iterable_enums::ContentModerationActionV0, MaxCuratorPermissionsPerLevelV0>;

    type StoredModerationPermissionsByLevelV0<T> = BoundedBTreeMap<
        <T as Config>::ChannelPrivilegeLevel,
        StoredCuratorModerationPermissionsV0,
        <T as Config>::MaxKeysPerCuratorGroupPermissionsByLevelMap,
    >;

    // #[frame_support::storage_alias]
    // type CuratorGroupByIdV0<T: Config> = StorageMap<
    //     Pallet<T>,
    //     Blake2_128Concat,
    //     <T as permissions::ContentActorAuthenticator>::CuratorGroupId,
    //     CuratorGroupV0<T>,
    // >;

    pub struct MigrateToV1<T>(sp_std::marker::PhantomData<T>);
    impl<T: Config> OnRuntimeUpgrade for MigrateToV1<T> {
        #[cfg(feature = "try-runtime")]
        fn pre_upgrade() -> Result<Vec<u8>, &'static str> {
            let onchain = Pallet::<T>::on_chain_storage_version();

            ensure!(onchain < 1, "this migration can be deleted");

            // using storage alias CuratorGroupByIdV0 was not working.
            // most likely wrong prefix is getting used, since even iterating over keys return 0 count.
            // So we use the new map but only iterate over keys to avoid decode errors. (if decode fails the item is skipped)
            let group_count: usize = CuratorGroupById::<T>::iter_keys().count();
            log!(info, "Number of curator groups pre_upgrade {}", group_count);

            Ok(group_count.to_be_bytes().to_vec())
        }

        fn on_runtime_upgrade() -> Weight {
            let onchain = Pallet::<T>::on_chain_storage_version();
            let current = Pallet::<T>::current_storage_version();

            if onchain > 0 {
                return T::DbWeight::get().reads(1);
            }

            use iterable_enums::ContentModerationActionV0;

            <CuratorGroupById<T>>::translate_values(
                |old_value: CuratorGroupV0<T>| -> Option<CuratorGroup<T>> {
                    log!(info, "Migrating group {:?}", old_value);
                    let mut permissions_by_level = ModerationPermissionsByLevel::<T>::new();
                    old_value
                        .permissions_by_level
                        .iter()
                        .for_each(|(level, permissions)| {
                            log!(info, "level: {:?}, permissions: {:?}", level, permissions);
                            let mut permissions_v1 = BTreeSet::new();
                            permissions.iter().for_each(|action| match action {
                                ContentModerationActionV0::HideVideo => {
                                    permissions_v1.insert(ContentModerationAction::HideVideo);
                                }
                                ContentModerationActionV0::HideChannel => {
                                    permissions_v1.insert(ContentModerationAction::HideChannel);
                                }
                                ContentModerationActionV0::ChangeChannelFeatureStatus(feature) => {
                                    permissions_v1.insert(
                                        ContentModerationAction::ChangeChannelFeatureStatus(
                                            *feature,
                                        ),
                                    );
                                }
                                ContentModerationActionV0::DeleteVideoAssets(b) => {
                                    permissions_v1
                                        .insert(ContentModerationAction::DeleteVideoAssets(*b));
                                }
                                ContentModerationActionV0::DeleteNonVideoChannelAssets => {
                                    permissions_v1.insert(
                                        ContentModerationAction::DeleteNonVideoChannelAssets,
                                    );
                                }
                                ContentModerationActionV0::UpdateChannelNftLimits => {
                                    permissions_v1
                                        .insert(ContentModerationAction::UpdateChannelNftLimits);
                                }
                                ContentModerationActionV0::DeleteVideo => {}
                                ContentModerationActionV0::DeleteChannel => {}
                            });
                            permissions_by_level.insert(*level, permissions_v1);
                        });
                    let mut group_created_successfully = false;
                    let mut group = CuratorGroupRecord::try_create::<T>(
                        old_value.active,
                        &permissions_by_level,
                    )
                    .map_or_else(
                        |_err| Default::default(),
                        |v| {
                            group_created_successfully = true;
                            v
                        },
                    );
                    if !group_created_successfully {
                        // The group will be dropped
                        log!(warn, "Failed to create a group");
                        return None;
                    }
                    old_value.curators.into_iter().for_each(|(k, v)| {
                        let result = group.try_add_curator::<T>(k, &v);
                        if result.is_err() {
                            log!(warn, "Failed to add curator to group");
                        }
                    });
                    Some(group)
                },
            );

            current.put::<Pallet<T>>();

            <T as frame_system::Config>::BlockWeights::get().max_block
        }

        #[cfg(feature = "try-runtime")]
        fn post_upgrade(state: Vec<u8>) -> Result<(), &'static str> {
            let onchain = Pallet::<T>::on_chain_storage_version();
            ensure!(onchain < 2, "this migration needs to be removed");
            ensure!(onchain == 1, "this migration needs to be run");
            let group_count = CuratorGroupById::<T>::iter().count();
            log!(
                info,
                "Number of curator groups post_upgrade {}",
                group_count
            );
            let pre_upgrade_group_count = usize::from_be_bytes(state.try_into().unwrap());
            ensure!(
                pre_upgrade_group_count == group_count,
                "group counts differ post_upgrade"
            );
            Ok(())
        }
    }
}
