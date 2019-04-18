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

use rstd::cmp::Ordering;
use runtime_primitives::traits::SimpleArithmetic;

#[derive(Encode, Decode, Clone, Copy, Default, Debug)]
pub struct Stake<Balance>
where
    Balance: Copy + SimpleArithmetic,
{
    pub new: Balance,
    pub transferred: Balance,
}

impl<Balance> Stake<Balance>
where
    Balance: Copy + SimpleArithmetic,
{
    pub fn total(&self) -> Balance {
        self.new + self.transferred
    }

    pub fn add(&self, v: &Self) -> Self {
        Self {
            new: self.new + v.new,
            transferred: self.transferred + v.transferred,
        }
    }
}

impl<T: Copy + SimpleArithmetic> PartialOrd for Stake<T> {
    fn partial_cmp(&self, other: &Self) -> Option<Ordering> {
        Some(self.cmp(&other))
    }
}

impl<T: Copy + SimpleArithmetic> Ord for Stake<T> {
    fn cmp(&self, other: &Self) -> Ordering {
        self.total().cmp(&other.total())
    }
}

impl<T: Copy + SimpleArithmetic> PartialEq for Stake<T> {
    fn eq(&self, other: &Self) -> bool {
        self.total() == other.total()
    }
}

impl<T: Copy + SimpleArithmetic> Eq for Stake<T> {}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn total() {
        let a: u128 = 4;
        let b: u128 = 5;
        let s = Stake {
            new: a,
            transferred: b,
        };
        assert_eq!(a + b, s.total());
    }

    #[test]
    fn adding() {
        let a1: u128 = 3;
        let b1: u128 = 2;
        let a2: u128 = 5;
        let b2: u128 = 7;

        let s1 = Stake {
            new: a1,
            transferred: b1,
        };

        let s2 = Stake {
            new: a2,
            transferred: b2,
        };

        let sum = s1.add(&s2);

        assert_eq!(sum.new, 8);
        assert_eq!(sum.transferred, 9);
    }

    #[test]
    fn equality() {
        let a1: u128 = 3;
        let b1: u128 = 2;
        let a2: u128 = 2;
        let b2: u128 = 3;
        let a3: u128 = 10;
        let b3: u128 = 10;

        let s1 = Stake {
            new: a1,
            transferred: b1,
        };

        let s2 = s1;

        assert_eq!(s1, s2);

        let s3 = Stake {
            new: a2,
            transferred: b2,
        };

        assert_eq!(s1, s3);

        let s4 = Stake {
            new: a3,
            transferred: b3,
        };

        assert_ne!(s1, s4);
    }
}
