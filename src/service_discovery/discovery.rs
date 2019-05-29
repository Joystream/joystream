use crate::traits::Roles;
use rstd::prelude::*;
use runtime_primitives::traits::As;

use srml_support::{decl_event, decl_module, decl_storage, ensure, StorageMap, StorageValue};
use system::{self, ensure_signed};
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

pub const MINIMUM_LIFETIME: u64 = 600; // 1hr assuming 6s block times
pub const DEFAULT_LIFETIME: u64 = MINIMUM_LIFETIME * 24; // 24hr

#[cfg_attr(feature = "std", derive(Serialize, Deserialize, Debug))]
#[derive(Encode, Decode, Default, Clone, PartialEq, Eq)]
pub struct AccountInfo<BlockNumber> {
    /// IPNS Identity
    pub identity: IPNSIdentity,
    /// Block at which information expires
    pub ttl: BlockNumber,
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
        pub DefaultLifetime get(default_lifetime): T::BlockNumber = T::BlockNumber::sa(DEFAULT_LIFETIME);
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

    pub fn is_alive(accountid: &T::AccountId) -> bool {
        <AccountInfoByAccountId<T>>::exists(accountid)
            && <AccountInfoByAccountId<T>>::get(accountid).ttl > <system::Module<T>>::block_number()
    }
}

decl_module! {
    pub struct Module<T: Trait> for enum Call where origin: T::Origin {
        fn deposit_event<T>() = default;

        pub fn set_ipns_id(origin, id: Vec<u8>, lifetime: Option<u64>) {
            let sender = ensure_signed(origin)?;
            ensure!(T::Roles::is_role_account(&sender), "only role accounts can set ipns id");

            // TODO: ensure id is a valid base58 encoded IPNS identity

            let ttl = match lifetime {
                Some(value) => if value >= MINIMUM_LIFETIME {
                    T::BlockNumber::sa(value)
                } else {
                    T::BlockNumber::sa(MINIMUM_LIFETIME)
                },
                _ => Self::default_lifetime()
            };

            <AccountInfoByAccountId<T>>::insert(&sender, AccountInfo {
                identity: id.clone(),
                ttl: <system::Module<T>>::block_number() + ttl,
            });
        }

        pub fn unset_ipns_id(origin) {
            let sender = ensure_signed(origin)?;
            Self::remove_account_info(&sender);
        }

        // privileged methods

        pub fn set_default_lifetime(lifetime: T::BlockNumber) {
            ensure!(lifetime >= T::BlockNumber::sa(MINIMUM_LIFETIME), "discovery: default ttl must be gte minimum ttl");
            <DefaultLifetime<T>>::put(lifetime);
        }

        pub fn set_bootstrap_endpoints(endpoints: Vec<Url>) {
            <BootstrapEndpoints<T>>::put(endpoints);
        }
    }
}
