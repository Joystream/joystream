// Copyright 2019 Joystream Contributors
// This file is part of Joystream runtime

// Joystream runtime is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.

// Joystream runtime is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU General Public License for more details.

// === Substrate ===
// Copyright 2017-2019 Parity Technologies (UK) Ltd.
// Substrate is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.

// Substrate is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU General Public License for more details.

// You should have received a copy of the GNU General Public License
// along with this software If not, see <http://www.gnu.org/licenses/>.

#![cfg(test)]

pub use super::{council, election, proposals};
pub use crate::currency::GovernanceCurrency;
use crate::traits::Members;
pub use system;

pub use primitives::{Blake2Hasher, H256};
pub use runtime_primitives::{
    testing::{Digest, DigestItem, Header, UintAuthorityId},
    traits::{BlakeTwo256, IdentityLookup, OnFinalize},
    BuildStorage,
};

use srml_support::impl_outer_origin;

impl_outer_origin! {
    pub enum Origin for Test {}
}

pub struct MockMembership {}
impl<T: system::Trait> Members<T> for MockMembership {
    type Id = u32;
    fn is_active_member(_who: &T::AccountId) -> bool {
        // all accounts are considered members.
        // There is currently no test coverage for non-members.
        // Should add some coverage, and update this method to reflect which accounts are or are not members
        true
    }
    fn lookup_member_id(_account_id: &T::AccountId) -> Result<Self::Id, &'static str> {
        Err("not implemented!")
    }
    fn lookup_account_by_member_id(_id: Self::Id) -> Result<T::AccountId, &'static str> {
        Err("not implemented!")
    }
}

// For testing the module, we construct most of a mock runtime. This means
// first constructing a configuration type (`Test`) which `impl`s each of the
// configuration traits of modules we want to use.
#[derive(Clone, Eq, PartialEq)]
pub struct Test;
impl system::Trait for Test {
    type Origin = Origin;
    type Index = u64;
    type BlockNumber = u64;
    type Hash = H256;
    type Hashing = BlakeTwo256;
    type Digest = Digest;
    type AccountId = u64;
    type Header = Header;
    type Event = ();
    type Log = DigestItem;
    type Lookup = IdentityLookup<u64>;
}
impl timestamp::Trait for Test {
    type Moment = u64;
    type OnTimestampSet = ();
}
impl consensus::Trait for Test {
    type SessionKey = UintAuthorityId;
    type InherentOfflineReport = ();
    type Log = DigestItem;
}
impl council::Trait for Test {
    type Event = ();

    type CouncilTermEnded = (Election,);
}
impl election::Trait for Test {
    type Event = ();

    type CouncilElected = (Council,);

    type Members = MockMembership;
}

impl balances::Trait for Test {
    type Event = ();

    /// The balance of an account.
    type Balance = u32;

    /// A function which is invoked when the free-balance has fallen below the existential deposit and
    /// has been reduced to zero.
    ///
    /// Gives a chance to clean up resources associated with the given account.
    type OnFreeBalanceZero = ();

    /// Handler for when a new account is created.
    type OnNewAccount = ();

    type TransactionPayment = ();
    type DustRemoval = ();
    type TransferPayment = ();
}

impl GovernanceCurrency for Test {
    type Currency = balances::Module<Self>;
}

// TODO add a Hook type to capture TriggerElection and CouncilElected hooks

// This function basically just builds a genesis storage key/value store according to
// our desired mockup.
pub fn initial_test_ext() -> runtime_io::TestExternalities<Blake2Hasher> {
    let t = system::GenesisConfig::<Test>::default()
        .build_storage()
        .unwrap()
        .0;

    runtime_io::TestExternalities::new(t)
}

pub type Election = election::Module<Test>;
pub type Council = council::Module<Test>;
pub type System = system::Module<Test>;
pub type Balances = balances::Module<Test>;
