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

use runtime_primitives::traits::Convert;
use srml_support::traits::{Currency, LockableCurrency, ReservableCurrency};
use system;

pub trait GovernanceCurrency: system::Trait + Sized {
    type Currency: Currency<Self::AccountId>
        + ReservableCurrency<Self::AccountId>
        + LockableCurrency<Self::AccountId, Moment = Self::BlockNumber>;
}

pub type BalanceOf<T> =
    <<T as GovernanceCurrency>::Currency as Currency<<T as system::Trait>::AccountId>>::Balance;

/// A structure that converts the currency type into a lossy u64
/// And back from u128
pub struct CurrencyToVoteHandler;

impl Convert<u128, u64> for CurrencyToVoteHandler {
    fn convert(x: u128) -> u64 {
        if x >> 96 == 0 {
            x as u64
        } else {
            u64::max_value()
        }
    }
}

impl Convert<u128, u128> for CurrencyToVoteHandler {
    fn convert(x: u128) -> u128 {
        // if it practically fits in u64
        if x >> 64 == 0 {
            x
        } else {
            // 0000_0000_FFFF_FFFF_FFFF_FFFF_0000_0000
            u64::max_value() as u128
        }
    }
}
