#![cfg_attr(not(feature = "std"), no_std)]

extern crate sr_std;
#[cfg(test)]
extern crate sr_io;
#[cfg(test)]
extern crate substrate_primitives;
extern crate sr_primitives;
#[cfg(feature = "std")]
extern crate parity_codec as codec;

use srml_support::inherent::cmp::Ordering;
use runtime_primitives::traits::{SimpleArithmetic, CheckedAdd, CheckedSub, Zero};

#[derive(Clone, Copy, Encode, Decode, Default)]
pub struct Stake<Balance> 
{
    pub refundable: Balance,
    pub transferred: Balance,
}

impl<Balance> Stake<Balance> 
    where Balance: SimpleArithmetic + CheckedAdd + Zero,
{
    pub fn total(&self) -> Balance {
        if let Some(t) = self.refundable.checked_add(&self.transferred) {
            t
        } else {
            Balance::zero() //overflow! howto deal with it?
        }
    }
}

impl<T: SimpleArithmetic + CheckedAdd> PartialOrd for Stake<T> {
    fn partial_cmp(&self, other: &Self) -> Option<Ordering> {
        Some(self.cmp(&other))
    }
}

impl<T: SimpleArithmetic> Ord for Stake<T> {
    fn cmp(&self, other: &Self) -> Ordering {
        self.total().cmp(&other.total())
    }
}

impl<T: SimpleArithmetic + CheckedAdd> PartialEq for Stake<T> {
    fn eq(&self, other: &Self) -> bool {
        self.total() == other.total()
    }
}

impl<T: SimpleArithmetic + CheckedAdd + CheckedSub> Eq for Stake<T> {}