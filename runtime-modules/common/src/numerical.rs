use std::ops::{Div, Mul};

use frame_support::dispatch::fmt::Debug;
use sp_runtime::{
    traits::{CheckedAdd, CheckedMul, CheckedSub, One, Saturating, Zero},
    FixedPointNumber, FixedU128, PerThing, Permill, Perquintill,
};

#[derive(Debug, PartialEq)]
pub enum ArithmeticError {
    NumericOverflow,
    NumericUnderflow,
}

pub const ORDER: usize = 20;

// u128 does not implement the Copy trait
pub fn natural_log_1_plus_x(interest: Permill) -> Result<Perquintill, ArithmeticError> {
    // ref: https://www.wolframalpha.com/input?i=taylor+series+for+ln%281%2Bx%29
    // ln(1 + x) is approx x - x^2/2 + x^3/3 - x^4/4 + x^5/5
    let mut terms = [Perquintill::zero(); ORDER];
    let x = Perquintill::from_parts(
        (interest.deconstruct() as u64).saturating_mul(1_000_000_000_000u64),
    );

    for i in 1..ORDER {
        let num = x.saturating_pow(i);
        let den = i as u32;
        terms[i] = num.div(den);
    }

    // first sum all + then subtract to avoid underflow errors
    let mut result = Perquintill::zero();
    for i in 0..ORDER.div(2) {
        result = result
            .checked_add(&terms[2 * i + 1])
            .ok_or(ArithmeticError::NumericOverflow)?
    }
    for i in 0..ORDER.div(2) {
        result = result
            .checked_sub(&terms[2 * i])
            .ok_or(ArithmeticError::NumericUnderflow)?
    }

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

    let mut series_result = Perquintill::zero();
    let mut den = 1u32;
    for i in 1..ORDER {
        den = (i as u32).saturating_mul(den);
        let term = xlog.saturating_pow(i).div(den);
        series_result = series_result.saturating_add(term);
    }

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

    let exp_int = exp.trunc().into_inner().div(FixedU128::DIV) as usize;
    let exp_frac = Perquintill::from_parts(exp.frac().into_inner() as u64);

    let base_pow_int = one_plus_interest_base.saturating_pow(exp_int);
    let base_pow_frac = one_plus_interest_pow_frac(interest, exp_frac)?;

    let result = base_pow_int.mul(base_pow_frac);

    Ok(result)
}

#[cfg(test)]
mod numerical_tests {
    use sp_runtime::traits::Zero;

    use super::*;

    #[test]
    fn log_approximation_is_accurate_up_to_14_dec_places() {
        let expected = Perquintill::from_float(0.139761942375158f64); // https://www.wolframalpha.com/input?i=ln%281+%2B+0.15%29
        let actual = natural_log_1_plus_x(Permill::from_percent(15)).unwrap();
        // quintillion = 1e18
        assert_eq!(
            actual.deconstruct().div(10_000),
            expected.deconstruct().div(10_000)
        )
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
        let expected = FixedU128::from_float(1.02118558583419f64); //https://www.wolframalpha.com/input?i=0.0211856&assumption=%22ClashPrefs%22+-%3E+%7B%22Math%22%7D
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

    #[test]
    fn one_plus_interest_pow_fixed_works_with_zero_interest() {
        let expected = FixedU128::one(); // (1 + 0)^x = 1
        let actual =
            one_plus_interest_pow_fixed(Permill::zero(), FixedU128::from_float(1.15f64)).unwrap();
        assert_eq!(expected, actual)
    }

    #[test]
    fn one_plus_interest_pow_fixed_works_with_zero_exponent() {
        let expected = FixedU128::one(); // a^0 = 1
        let actual =
            one_plus_interest_pow_fixed(Permill::from_percent(10), FixedU128::zero()).unwrap();
        assert_eq!(expected, actual)
    }

    #[test]
    fn one_plus_interest_pow_fixed_works_with_int_exp() {
        let expected = FixedU128::from_float(1.404928f64);
        let actual =
            one_plus_interest_pow_fixed(Permill::from_percent(12), FixedU128::from_float(3.00f64))
                .unwrap();
        assert_eq!(expected, actual)
    }

    #[test]
    fn one_plus_interest_pow_fixed_accurate_with_frac_exp_16_dec_places() {
        let expected = FixedU128::from_float(1.026408276205842713427f64);
        let actual =
            one_plus_interest_pow_fixed(Permill::from_percent(12), FixedU128::from_float(0.23f64))
                .unwrap();
        assert_eq!(
            expected.into_inner().div(1000),
            actual.into_inner().div(1000)
        )
    }

    #[test]
    fn one_plus_interest_pow_fixed_accurate_up_to_16_dec() {
        let expected = FixedU128::from_float(1.478434805499594623f64);
        let actual =
            one_plus_interest_pow_fixed(Permill::from_percent(12), FixedU128::from_float(3.45f64))
                .unwrap();
        assert_eq!(
            expected.into_inner().div(1000),
            actual.into_inner().div(1000)
        )
    }
}
