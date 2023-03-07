use std::ops::{Div, Mul};

use frame_support::dispatch::fmt::Debug;
use sp_runtime::{
    traits::{CheckedAdd, CheckedMul, CheckedSub, One, Saturating},
    FixedPointNumber, FixedU128, PerThing, Permill, Perquintill,
};

#[derive(Debug, PartialEq)]
pub enum ArithmeticError {
    NumericOverflow,
    NumericUnderflow,
}

// u128 does not implement the Copy trait
pub fn natural_log_1_plus_x(interest: Permill) -> Result<Perquintill, ArithmeticError> {
    // ref: https://www.wolframalpha.com/input?i=taylor+series+for+ln%281%2Bx%29
    // ln(1 + x) is approx x - x^2/2 + x^3/3 - x^4/4 + x^5/5

    let x = Perquintill::from_parts(
        (interest.deconstruct() as u64).saturating_mul(1_000_000_000_000u64),
    );
    let x2 = x.checked_mul(&x).ok_or(ArithmeticError::NumericOverflow)?;
    let x3 = x2.checked_mul(&x).ok_or(ArithmeticError::NumericOverflow)?;
    let x4 = x3.checked_mul(&x).ok_or(ArithmeticError::NumericOverflow)?;
    let x5 = x4.checked_mul(&x).ok_or(ArithmeticError::NumericOverflow)?;
    let x6 = x5.checked_mul(&x).ok_or(ArithmeticError::NumericOverflow)?;

    let first_term = x;
    let second_term = x2.div(2u8);
    let third_term = x3.div(3u8);
    let fourth_term = x4.div(4u8);
    let fifth_term = x5.div(5u8);
    let sixth_term = x6.div(6u8);

    // first sum all + then subtract to avoid underflow errors
    let result = first_term
        .checked_add(&third_term)
        .ok_or(ArithmeticError::NumericOverflow)?
        .checked_add(&fifth_term)
        .ok_or(ArithmeticError::NumericOverflow)?
        .checked_sub(&second_term)
        .ok_or(ArithmeticError::NumericUnderflow)?
        .checked_sub(&fourth_term)
        .ok_or(ArithmeticError::NumericUnderflow)?
        .checked_sub(&sixth_term)
        .ok_or(ArithmeticError::NumericUnderflow)?;

    Ok(result)
}

pub fn one_plus_interest_pow_frac(
    interest: Permill,
    exp: Perquintill,
) -> Result<FixedU128, ArithmeticError> {
    // ref: https://www.wolframalpha.com/input?i=taylor+series+%281+%2B+r%29%5Ex+with+r+in+%5B0%2C1%29+and+x+in+%5B0%2C1%5D+with+respect+to+x
    let log_term = natural_log_1_plus_x(interest)?;
    let x = exp;
    let xlog = x
        .checked_mul(&log_term)
        .ok_or(ArithmeticError::NumericOverflow)?;
    let x2log2 = xlog
        .checked_mul(&xlog)
        .ok_or(ArithmeticError::NumericOverflow)?;
    let x3log3 = x2log2
        .checked_mul(&xlog)
        .ok_or(ArithmeticError::NumericOverflow)?;
    let x4log4 = x3log3
        .checked_mul(&xlog)
        .ok_or(ArithmeticError::NumericOverflow)?;
    let x5log5 = x4log4
        .checked_mul(&xlog)
        .ok_or(ArithmeticError::NumericOverflow)?;

    let first_term = xlog;
    let second_term = x2log2.div(2);
    let third_term = x3log3.div(3);
    let fourth_term = x4log4.div(4);
    let fifth_term = x5log5.div(5);

    let series_result = first_term
        .checked_add(&second_term)
        .ok_or(ArithmeticError::NumericOverflow)?
        .checked_add(&third_term)
        .ok_or(ArithmeticError::NumericOverflow)?
        .checked_add(&fourth_term)
        .ok_or(ArithmeticError::NumericOverflow)?
        .checked_add(&fifth_term)
        .ok_or(ArithmeticError::NumericOverflow)?;

    let result = FixedU128::saturating_from_rational(
        series_result.deconstruct() as u128,
        Perquintill::ACCURACY,
    )
    .saturating_add(FixedU128::one());

    Ok(result)
}

pub fn one_plus_interest_pow_fixed(
    interest: Permill,
    exp: FixedU128,
) -> Result<FixedU128, ArithmeticError> {
    let one_plus_interest_base = FixedU128::saturating_from_rational(
        interest.deconstruct() as u128,
        Permill::ACCURACY as u128,
    )
    .saturating_add(FixedU128::one());
    let exp_int = exp.trunc().into_inner() as usize;
    let exp_frac = Perquintill::from_parts(exp.frac().into_inner() as u64);

    let base_pow_int = one_plus_interest_base.saturating_pow(exp_int);
    let base_pow_frac = one_plus_interest_pow_frac(interest, exp_frac)?;

    let result = base_pow_int.mul(base_pow_frac);

    Ok(result)
}

#[cfg(test)]
mod numerical_tests {
    use sp_runtime::{traits::Zero, PerThing};

    use super::*;

    #[test]
    fn log_approximation_is_accurate() {
        let expected = Perquintill::from_float(0.139763f64); // https://www.wolframalpha.com/input?i=ln%281+%2B+0.15%29
        let actual = natural_log_1_plus_x(Permill::from_percent(15)).unwrap();
        assert_eq!(actual, expected)
    }

    #[test]
    fn log_approximation_is_accurate_with_zero() {
        let expected = Perquintill::zero();
        let actual = natural_log_1_plus_x(Permill::zero()).unwrap();
        assert_eq!(actual, expected)
    }

    #[test]
    fn log_approx_throws_with_one() {
        let actual = natural_log_1_plus_x(Permill::one());
        assert_eq!(actual, Err(ArithmeticError::NumericOverflow))
    }

    #[test]
    fn interest_computation_is_accurate() {
        let expected = FixedU128::from_float(0.021186f64); //https://www.wolframalpha.com/input?i=0.0211856&assumption=%22ClashPrefs%22+-%3E+%7B%22Math%22%7D
        let actual =
            one_plus_interest_pow_frac(Permill::from_percent(15), Perquintill::from_percent(15))
                .unwrap();
        assert_eq!(actual, expected)
    }

    #[test]
    fn interest_computation_is_accurate_with_zero_interest() {
        let expected = Zero::zero(); //(1 + 0)^x  = 0
        let actual =
            one_plus_interest_pow_frac(Permill::zero(), Perquintill::from_percent(15)).unwrap();
        assert_eq!(actual, expected)
    }
}
