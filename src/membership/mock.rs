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

pub use super::members;
pub use crate::currency::GovernanceCurrency;
pub use srml_support::traits::Currency;
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

// For testing the module, we construct most of a mock runtime. This means
// first constructing a configuration type (`Test`) which `impl`s each of the
// configuration traits of modules we want to use.
#[derive(Clone, Eq, PartialEq, Debug)]
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

impl members::Trait for Test {
    type Event = ();
    type MemberId = u32;
    type PaidTermId = u32;
    type SubscriptionId = u32;
    type Roles = ();
}

pub struct ExtBuilder {
    first_member_id: u32,
    default_paid_membership_fee: u32,
}
impl Default for ExtBuilder {
    fn default() -> Self {
        Self {
            first_member_id: 1,
            default_paid_membership_fee: 100,
        }
    }
}

impl ExtBuilder {
    pub fn first_member_id(mut self, first_member_id: u32) -> Self {
        self.first_member_id = first_member_id;
        self
    }
    pub fn default_paid_membership_fee(mut self, default_paid_membership_fee: u32) -> Self {
        self.default_paid_membership_fee = default_paid_membership_fee;
        self
    }
    pub fn build(self) -> runtime_io::TestExternalities<Blake2Hasher> {
        let mut t = system::GenesisConfig::<Test>::default()
            .build_storage()
            .unwrap()
            .0;

        t.extend(
            members::GenesisConfig::<Test> {
                first_member_id: self.first_member_id,
                default_paid_membership_fee: self.default_paid_membership_fee,
            }
            .build_storage()
            .unwrap()
            .0,
        );

        t.into()
    }
}

pub type Balances = balances::Module<Test>;
pub type Members = members::Module<Test>;
