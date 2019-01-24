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
use runtime_primitives::traits::{SimpleArithmetic, CheckedAdd, Zero};

//use std::ops::Add; // cant use this in WASM runtime
//use rstd::ops::Add;

#[derive(Clone, Copy, Encode, Decode, Default)]
pub struct Stake<Balance> 
    where Balance: Copy + SimpleArithmetic + CheckedAdd + Zero,
{
    pub refundable: Balance,
    pub transferred: Balance,
}

impl<Balance> Stake<Balance>
    where Balance: Copy + SimpleArithmetic + CheckedAdd + Zero,
{
    pub fn total(&self) -> Balance {
        self.refundable + self.transferred
    }

    pub fn checked_add(&self, v: &Self) -> Option<Self> {
        if let Some(refundable) = self.refundable.checked_add(&v.refundable) {
            if let Some(transferred) = self.transferred.checked_add(&v.transferred) {
                return Some(Self {
                    refundable,
                    transferred
                })
            }
        }

        None
    }

    pub fn add(&self, v: &Self) -> Self {
        Self {
            refundable: self.refundable + v.refundable,
            transferred: self.transferred + v.transferred
        }
    }
}

// impl<Balance> CheckedAdd for Stake<Balance> {
//     fn checked_add(&self, v: &Self) -> Option<Self> {
//     }
// }

// impl<T: Add<Output=T> + Copy> Add for Stake<T>  // Balance doesn't satisfy T: Add<Output=T>
// {
//     type Output = Stake<T>;

//     fn add(self, other: Stake<T>) -> Stake<T> {
//         Stake {
//             refundable: self.refundable + other.refundable,
//             transferred: self.transferred + other.transferred
//         }
//     }
// }

impl<T: Copy + SimpleArithmetic + CheckedAdd + Zero> PartialOrd for Stake<T> {
    fn partial_cmp(&self, other: &Self) -> Option<Ordering> {
        Some(self.cmp(&other))
    }
}

impl<T: Copy + SimpleArithmetic + CheckedAdd + Zero> Ord for Stake<T> {
    fn cmp(&self, other: &Self) -> Ordering {
        self.total().cmp(&other.total())
    }
}

impl<T: Copy + SimpleArithmetic + CheckedAdd + Zero> PartialEq for Stake<T> {
    fn eq(&self, other: &Self) -> bool {
        self.total() == other.total()
    }
}

impl<T: Copy + SimpleArithmetic + CheckedAdd + Zero> Eq for Stake<T> {}