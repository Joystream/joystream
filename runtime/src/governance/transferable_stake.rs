#![cfg_attr(not(feature = "std"), no_std)]

use rstd::cmp::Ordering;
use runtime_primitives::traits::{SimpleArithmetic};

#[derive(Encode, Decode, Clone, Copy, Default, Debug)]
pub struct Stake<Balance>
    where Balance: Copy + SimpleArithmetic,
{
    pub refundable: Balance,
    pub transferred: Balance,
}

impl<Balance> Stake<Balance>
    where Balance: Copy + SimpleArithmetic,
{
    pub fn total(&self) -> Balance {
        self.refundable + self.transferred
    }

    // pub fn checked_add(&self, v: &Self) -> Option<Self> {
    //     if let Some(refundable) = self.refundable.checked_add(&v.refundable) {
    //         if let Some(transferred) = self.transferred.checked_add(&v.transferred) {
    //             return Some(Self {
    //                 refundable,
    //                 transferred
    //             })
    //         }
    //     }
    //     None
    // }

    pub fn add(&self, v: &Self) -> Self {
        Self {
            refundable: self.refundable + v.refundable,
            transferred: self.transferred + v.transferred
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
            refundable: a,
            transferred: b,
        };
        assert_eq!(a + b, s.total());
    }

    #[test]
    fn adding() {
        let a1: u128 = 3; let b1: u128 = 2;
        let a2: u128 = 5; let b2: u128 = 7;

        let s1 = Stake {
            refundable: a1,
            transferred: b1,
        };

        let s2 = Stake {
            refundable: a2,
            transferred: b2,
        };

        let sum = s1.add(&s2);

        assert_eq!(sum.refundable, 8);
        assert_eq!(sum.transferred, 9);
    }

    #[test]
    fn equality(){
        let a1: u128 = 3; let b1: u128 = 2;
        let a2: u128 = 2; let b2: u128 = 3;
        let a3: u128 = 10; let b3: u128 = 10;

        let s1 = Stake {
            refundable: a1,
            transferred: b1,
        };

        let s2 = s1;

        assert_eq!(s1, s2);

        let s3 = Stake {
            refundable: a2,
            transferred: b2,
        };
        
        assert_eq!(s1, s3);

        let s4 = Stake {
            refundable: a3,
            transferred: b3,
        };

        assert_ne!(s1, s4);
    }
}