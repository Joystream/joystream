#![cfg_attr(not(feature = "std"), no_std)]

use ink_lang as ink;

/*
// 2. Implement `EnvTypes` trait, specifying custom types
impl ink_core::env::EnvTypes for CustomRuntimeTypes {
    type AccountId = [u8; 32];
    type Balance = u128;
    type Hash = [u8; 32];
    type Moment = u64;
}
*/

// TODO
//
// 1. An easy way to parametrise types that come from runtime, such that
// contract deployer need not actually change any source code to build for desired set
// of actual types. For now, I will just use specific types to make progress.

// To be parametrised types

// Good side projects?
// double map
// linked double map.

// 2. Benchmarking improvements.

#[ink::contract(version = "0.1.0")]
mod content_directory {

    #[cfg(not(feature = "ink-as-dependency"))]
    use ink_core::storage::{
        self,
        Flush
    };

    pub type UserId = u64;
    pub type CuratorId = u64;
    
    pub type VideoId = u64;
    pub type VideoCategoryId = u64;
    pub type VideoLabelId = u64;
    pub type VideoPlaylistId = u64;

    pub type SystemVideoChannelId = u64;
    pub type UserVideoChannelId = u64;

    // Perhaps each field map should be in separate contract, to
    // aid migration.
    // Perhaps a separate map for each field also, to make it even faster to migrate?
    // Separate storage from implementation!!
    // make general enough that other contracts can do anything a user can do
    // such that users can deplpy whatever schemes they want, and also interoprates
    // well with future CCM probably.

    /// Defines the storage of your contract.
    /// Add new fields to the below struct in order
    /// to add new static storage fields to your contract.
    #[ink(storage)]
    struct ContentDirectory {

        // Migration idea
        // Split each storage field into its own pure data contract
        // beyond this, for field which are maps to structs, as a second measure
        // consider splitting each field into its own map, so they can be migrated
        // separately. Add simple get(id) -> T/put(id, T) routines on eaach such contract,
        // that work with a full struct type. Each contract should be pausable also,
        // so that no puts are allowed.
        // 
        // 
        // Each write operation desired in the directory is further its own
        // contract. It can only be initialized to make/read write operations through
        // some ACL hub thing. this allows write operation contracts to only
        // access specific things
        // question: how do I prevent contract from ebing roughe.. i.e. dialing out
        // to outside of contract module, or invoking some contract in some way it sohuld not??
        //
        // More thinking is needed in the above, and more familiarity with
        // contract security model.

        value: storage::Value<bool>,

        users: storage::HashMap::<UserId, User>,
        curators: storage::HashMap::<CuratorId, Curator>,
        user_video_channels: storage::HashMap<UserVideoChannelId, UserVideoChannel>,
        videos: storage::HashMap<VideoId, Video>,

        video_categories: storage::HashMap<VideoCategoryId, VideoCategory>

    }

    impl ContentDirectory {
        /// Constructor that initializes the `bool` value to the given `init_value`.
        #[ink(constructor)]
        fn new(&mut self, init_value: bool) {
            self.value.set(init_value);
        }

        /// Constructor that initializes the `bool` value to `false`.
        ///
        /// Constructors can delegate to other constructors.
        #[ink(constructor)]
        fn default(&mut self) {
            self.new(false)
        }

        //fn new(&mut self, ...)

        // calls related to deploying or adding new contracts???
        //

        /*
        // none of these can be accesed here, must be called
        // by runtime
        pub fn add_user
        pub fn update_user
        pub fn delete_user <== ??? 
        */

        /*
        /// User updates own profile
        #[ink(message)]
        pub user_update_user
        */

        /*
        #[ink(message)]
        pub curator_updates_user_status() {

        }
        */

        /*

        // Adding and editing videos

        #[ink(message)]
        pub add_video()

        #[ink(message)]
        pub update_video_as_channel_owner()

        #[ink(message)]
        pub update_video_as_curator()
        */


        /*
        #[ink(message)]
        pub pay_for_video_access()
        */


        /// A message that can be called on instantiated contracts.
        /// This one flips the value of the stored `bool` from `true`
        /// to `false` and vice versa.
        #[ink(message)]
        fn flip(&mut self) {
            *self.value = !self.get();
        }

        /// Simply returns the current value of our `bool`.
        #[ink(message)]
        fn get(&self) -> bool {
            *self.value
        }
    }

    ///...
    #[derive(Debug, Clone, PartialEq, Eq, scale::Encode, scale::Decode, Flush)]
    #[cfg_attr(feature = "ink-generate-abi", derive(type_metadata::Metadata))]
    pub struct User {
        account: AccountId,
        status: bool
    }

    ///...
    #[derive(Debug, Clone, PartialEq, Eq, scale::Encode, scale::Decode, Flush)]
    #[cfg_attr(feature = "ink-generate-abi", derive(type_metadata::Metadata))]
    pub struct Curator {
        account: AccountId,
        status: bool
    }

    /// ...
    #[derive(Debug, Clone, PartialEq, Eq, scale::Encode, scale::Decode, Flush)]
    #[cfg_attr(feature = "ink-generate-abi", derive(type_metadata::Metadata))]
    pub struct UserVideoChannel {
        owning_user_id: UserId,
        channel_revenue_account: AccountId,

        // if we allow setting the owner of an actual video channel contract,
        // then people can deploy their own logic for controlling a channel.
        
    }

    /// ..
    #[derive(Debug, Clone, PartialEq, Eq, scale::Encode, scale::Decode, Flush)]
    #[cfg_attr(feature = "ink-generate-abi", derive(type_metadata::Metadata))]
    pub struct SystemVideoChannel {
        // if we allow setting the owner of an actual video channel contract,
        // then people can deploy their own logic for controlling a channel.
    }

    /// ...
    #[derive(Debug, Clone, PartialEq, Eq, scale::Encode, scale::Decode, Flush)]
    #[cfg_attr(feature = "ink-generate-abi", derive(type_metadata::Metadata))]
    pub enum VideoChannelId {
        SystemVideoChannel(SystemVideoChannelId),
        UserVideoChannel(UserVideoChannelId)
    }

    ///..
    #[derive(Debug, Clone, PartialEq, Eq, scale::Encode, scale::Decode, Flush)]
    #[cfg_attr(feature = "ink-generate-abi", derive(type_metadata::Metadata))]
    pub struct Video {
        video_channel_id: VideoChannelId,
        includable_in_foreign_playlists: bool,
        title: Vec<u8>

        // license + payment + access stuff, ads?
    }
    
    #[derive(Debug, Clone, PartialEq, Eq, scale::Encode, scale::Decode, Flush)]
    #[cfg_attr(feature = "ink-generate-abi", derive(type_metadata::Metadata))]
    pub struct VideoCategory {
        parent_video_category_id: Option<VideoCategoryId>,
        can_currently_be_used: bool,
    }

    #[derive(Debug, Clone, PartialEq, Eq, scale::Encode, scale::Decode, Flush)]
    #[cfg_attr(feature = "ink-generate-abi", derive(type_metadata::Metadata))]
    pub struct VideoLabel {
        can_currently_be_used: bool,
    }

    #[derive(Debug, Clone, PartialEq, Eq, scale::Encode, scale::Decode, Flush)]
    #[cfg_attr(feature = "ink-generate-abi", derive(type_metadata::Metadata))]
    pub struct VideoPlaylist {
        video_channel_id: VideoChannelId,
        title: Vec<u8>
    }
}