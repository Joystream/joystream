#![cfg_attr(not(feature = "std"), no_std)]

use srml_support::inherent::cmp::Ordering;
use runtime_primitives::traits::{SimpleArithmetic, Zero};

#[derive(Clone, Copy, Encode, Decode, Default)]
pub struct Stake<Balance> 
    where Balance: Copy + SimpleArithmetic + Zero,
{
    pub refundable: Balance,
    pub transferred: Balance,
}

impl<Balance> Stake<Balance>
    where Balance: Copy + SimpleArithmetic + Zero,
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

impl<T: Copy + SimpleArithmetic + Zero> PartialOrd for Stake<T> {
    fn partial_cmp(&self, other: &Self) -> Option<Ordering> {
        Some(self.cmp(&other))
    }
}

impl<T: Copy + SimpleArithmetic + Zero> Ord for Stake<T> {
    fn cmp(&self, other: &Self) -> Ordering {
        self.total().cmp(&other.total())
    }
}

impl<T: Copy + SimpleArithmetic + Zero> PartialEq for Stake<T> {
    fn eq(&self, other: &Self) -> bool {
        self.total() == other.total()
    }
}

impl<T: Copy + SimpleArithmetic + Zero> Eq for Stake<T> {}