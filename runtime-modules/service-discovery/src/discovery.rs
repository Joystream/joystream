use codec::{Decode, Encode};
use roles::traits::Roles;
use rstd::prelude::*;
#[cfg(feature = "std")]
use serde::{Deserialize, Serialize};

use srml_support::{decl_event, decl_module, decl_storage, ensure};
use system::{self, ensure_root, ensure_signed};
/*
  Although there is support for ed25519 keys as the IPNS identity key and we could potentially
  reuse the same key for the role account and ipns (and make this discovery module obselete)
  it is probably better to separate concerns.
  Why not to use a fixed size 32byte -> SHA256 hash of public key: because we would have to force
  specific key type on ipfs side.
  pub struct IPNSIdentity(pub [u8; 32]); // we loose the key type!
  pub type IPNSIdentity(pub u8, pub [u8; 32]); // we could add the keytype?
  can we use rust library in wasm runtime?
  https://github.com/multiformats/rust-multihash
  https://github.com/multiformats/multicodec/
  https://github.com/multiformats/multihash/
*/
/// base58 encoded IPNS identity multihash codec
pub type IPNSIdentity = Vec<u8>;

/// HTTP Url string to a discovery service endpoint
pub type Url = Vec<u8>;

pub const MINIMUM_LIFETIME: u32 = 600; // 1hr assuming 6s block times
pub const DEFAULT_LIFETIME: u32 = MINIMUM_LIFETIME * 24; // 24hr

#[cfg_attr(feature = "std", derive(Serialize, Deserialize, Debug))]
#[derive(Encode, Decode, Default, Clone, PartialEq, Eq)]
pub struct AccountInfo<BlockNumber> {
    /// IPNS Identity
    pub identity: IPNSIdentity,
    /// Block at which information expires
    pub expires_at: BlockNumber,
}

pub trait Trait: system::Trait {
    type Event: From<Event<Self>> + Into<<Self as system::Trait>::Event>;

    type Roles: Roles<Self>;
}

decl_storage! {
    trait Store for Module<T: Trait> as Discovery {
        /// Bootstrap endpoints maintained by root
        pub BootstrapEndpoints get(bootstrap_endpoints): Vec<Url>;
        /// Mapping of service providers' AccountIds to their AccountInfo
        pub AccountInfoByAccountId get(account_info_by_account_id): map T::AccountId => AccountInfo<T::BlockNumber>;
        /// Lifetime of an AccountInfo record in AccountInfoByAccountId map
        pub DefaultLifetime get(default_lifetime) config(): T::BlockNumber = T::BlockNumber::from(DEFAULT_LIFETIME);
    }
}

decl_event! {
    pub enum Event<T> where <T as system::Trait>::AccountId {
        AccountInfoUpdated(AccountId, IPNSIdentity),
        AccountInfoRemoved(AccountId),
    }
}

impl<T: Trait> Module<T> {
    pub fn remove_account_info(accountid: &T::AccountId) {
        if <AccountInfoByAccountId<T>>::exists(accountid) {
            <AccountInfoByAccountId<T>>::remove(accountid);
            Self::deposit_event(RawEvent::AccountInfoRemoved(accountid.clone()));
        }
    }

    pub fn is_account_info_expired(accountid: &T::AccountId) -> bool {
        !<AccountInfoByAccountId<T>>::exists(accountid)
            || <system::Module<T>>::block_number()
                > <AccountInfoByAccountId<T>>::get(accountid).expires_at
    }
}

decl_module! {
    pub struct Module<T: Trait> for enum Call where origin: T::Origin {
        fn deposit_event() = default;

        pub fn set_ipns_id(origin, id: Vec<u8>, lifetime: Option<T::BlockNumber>) {
            let sender = ensure_signed(origin)?;
            ensure!(T::Roles::is_role_account(&sender), "only role accounts can set ipns id");

            // TODO: ensure id is a valid base58 encoded IPNS identity

            let ttl = match lifetime {
                Some(value) => if value >= T::BlockNumber::from(MINIMUM_LIFETIME) {
                    value
                } else {
                    T::BlockNumber::from(MINIMUM_LIFETIME)
                },
                _ => Self::default_lifetime()
            };

            <AccountInfoByAccountId<T>>::insert(&sender, AccountInfo {
                identity: id.clone(),
                expires_at: <system::Module<T>>::block_number() + ttl,
            });

            Self::deposit_event(RawEvent::AccountInfoUpdated(sender.clone(), id.clone()));
        }

        pub fn unset_ipns_id(origin) {
            let sender = ensure_signed(origin)?;
            Self::remove_account_info(&sender);
        }

        // privileged methods

        pub fn set_default_lifetime(origin, lifetime: T::BlockNumber) {
            // although not strictly required to have an origin parameter and ensure_root
            // decl_module! macro takes care of it.. its required for unit tests to work correctly
            // otherwise it complains the method
            ensure_root(origin)?;
            ensure!(lifetime >= T::BlockNumber::from(MINIMUM_LIFETIME), "discovery: default lifetime must be gte minimum lifetime");
            <DefaultLifetime<T>>::put(lifetime);
        }

        pub fn set_bootstrap_endpoints(origin, endpoints: Vec<Vec<u8>>) {
            ensure_root(origin)?;
            BootstrapEndpoints::put(endpoints);
        }
    }
}
