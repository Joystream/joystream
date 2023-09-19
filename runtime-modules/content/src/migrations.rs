// Migrations for Content Pallet

use super::*;
use frame_support::{
    dispatch::GetStorageVersion, parameter_types, traits::OnRuntimeUpgrade, BoundedBTreeMap,
    BoundedBTreeSet,
};
use sp_std::collections::btree_map::BTreeMap;

#[cfg(feature = "try-runtime")]
use frame_support::ensure;

// Migration where we removed to enum variants DeleteVideo and DeleteChannel
// from ContentModerationAction
const CURRENT_STORAGE_VERSION: StorageVersion = StorageVersion::new(1);

pub mod nara {
    use super::*;
    use frame_support::pallet_prelude::*;

    // Proc macro (EnumIter) clippy::integer_arithmetic disable hack
    #[allow(clippy::integer_arithmetic)]
    mod iterable_enums {
        use super::PausableChannelFeature;
        use codec::{Decode, Encode, MaxEncodedLen};
        use scale_info::TypeInfo;
        #[cfg(feature = "std")]
        use serde::{Deserialize, Serialize};
        #[cfg(feature = "std")]
        use strum_macros::EnumIter;
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

    #[frame_support::storage_alias]
    type CuratorGroups<T: Config> = StorageMap<
        Pallet<T>,
        Blake2_128Concat,
        <T as permissions::ContentActorAuthenticator>::CuratorGroupId,
        CuratorGroupV0<T>,
    >;

    pub struct MigrateToV1<T>(sp_std::marker::PhantomData<T>);
    impl<T: Config> OnRuntimeUpgrade for MigrateToV1<T> {
        #[cfg(feature = "try-runtime")]
        fn pre_upgrade() -> Result<Vec<u8>, &'static str> {
            let onchain = Pallet::<T>::on_chain_storage_version();

            ensure!(onchain < 1, "this migration can be deleted");

            Ok(Vec::new())
        }

        fn on_runtime_upgrade() -> Weight {
            let onchain = Pallet::<T>::on_chain_storage_version();

            if onchain > 0 {
                return T::DbWeight::get().reads(1);
            }

            // WIP
            <CuratorGroupById<T>>::translate_values(
                |old_value: CuratorGroupV0<T>| -> Option<CuratorGroup<T>> {
                    None
                    // Some(CuratorGroup::<T> {
                    //     curators: old_value.curators,
                    //     active: old_value.active,
                    //     permissions_by_level: old_value.permissions_by_level.map(|(level, permission_set)| {
                    //         // construct new set from permission_set
                    //     }),
                    // })
                },
            );

            CURRENT_STORAGE_VERSION.put::<Pallet<T>>();

            <T as frame_system::Config>::BlockWeights::get().max_block
        }

        #[cfg(feature = "try-runtime")]
        fn post_upgrade(_state: Vec<u8>) -> Result<(), &'static str> {
            let onchain = Pallet::<T>::on_chain_storage_version();
            ensure!(onchain < 2, "this migration needs to be removed");
            ensure!(onchain == 1, "this migration needs to be run");
            Ok(())
        }
    }
}
