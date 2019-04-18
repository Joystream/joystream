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

use crate::currency::GovernanceCurrency;
use rstd::prelude::*;
use runtime_primitives::traits::Zero;
use srml_support::traits::Currency;
use srml_support::{decl_event, decl_module, decl_storage, ensure, StorageMap};
use system::{self, ensure_signed};

pub trait Trait: system::Trait + GovernanceCurrency {
    type Event: From<Event<Self>> + Into<<Self as system::Trait>::Event>;
}

decl_storage! {
    trait Store for Module<T: Trait> as Memo {
        Memo get(memo) : map T::AccountId => Vec<u8>;
        MaxMemoLength get(max_memo_length) : u32 = 4096;
    }
}

decl_event! {
    pub enum Event<T> where <T as system::Trait>::AccountId {
        MemoUpdated(AccountId),
    }
}

decl_module! {
    pub struct Module<T: Trait> for enum Call where origin: T::Origin {
        fn deposit_event<T>() = default;

        fn update_memo(origin, memo: Vec<u8>) {
            let sender = ensure_signed(origin)?;

            ensure!(!T::Currency::total_balance(&sender).is_zero(), "account must have a balance");
            ensure!(memo.len() as u32 <= Self::max_memo_length(), "memo too long");

            <Memo<T>>::insert(sender.clone(), memo);
            Self::deposit_event(RawEvent::MemoUpdated(sender));
        }
    }
}
