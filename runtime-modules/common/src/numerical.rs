use core::ops::Div;

use sp_arithmetic::traits::{AtLeast32BitUnsigned, CheckedAdd, CheckedMul, CheckedNeg, CheckedSub};
use sp_runtime::{
    traits::{One, Saturating},
    FixedPointNumber, FixedU128, PerThing, Permill, Perquintill,
};

// order of the Tylor series expansion
const ORDER: usize = 20;

// does not work with 100% interest
fn natural_log_1_plus_x(interest: Permill) -> Perquintill {
    // ref: https://www.wolframalpha.com/input?i=taylor+series+for+ln%281%2Bx%29
    // ln(1 + x) is approx x - x^2/2 + x^3/3 - x^4/4 + x^5/5
    let mut terms = [Perquintill::zero(); ORDER];
    let x = Perquintill::from_parts(
        (interest.deconstruct() as u64).saturating_mul(1_000_000_000_000u64),
    );

    (1..ORDER).for_each(|i| {
        let num = x.saturating_pow(i);
        let den = i as u32;
        terms[i] = num.div(den);
    });

    // sum all odd indices terms first
    let mut result = Perquintill::zero();
    for el in terms.iter().skip(1).step_by(2) {
        result = result.saturating_add(*el);
    }
    // subtract all even indices terms
    for el in terms.iter().step_by(2) {
        result = result.saturating_sub(*el);
    }

    result
}

fn one_plus_interest_pow_frac(interest: Permill, exp: Perquintill) -> FixedU128 {
    // ref: https://www.wolframalpha.com/input?i=taylor+series+%281+%2B+r%29%5Ex+with+r+in+%5B0%2C1%29+and+x+in+%5B0%2C1%5D+with+respect+to+x
    let log_term = natural_log_1_plus_x(interest);
    let x = exp;
    let xlog = x.saturating_mul(log_term);

    let mut series_result = Perquintill::zero();
    let mut den = 1u32;
    for i in 1..ORDER {
        den = (i as u32).saturating_mul(den);
        let term = xlog.saturating_pow(i).div(den);
        series_result = series_result.saturating_add(term);
    }

    FixedU128::saturating_from_rational(series_result.deconstruct() as u128, Perquintill::ACCURACY)
        .saturating_add(FixedU128::one())
}

/// The approximation is computed as follows:
/// the `exponent` is decomposed into its `exponent = integer + fractional`
/// from `integer` we compute `x = (1 + interest/100)^integer`
/// from `fractional` we compute `y = (1 + interest/100)^fractional` using the following taylor series
/// expansion up to order `ORDER`:
/// `(1 + r)^f = 1 + f*log(1+r) + [f*log(1+r)]^2/2! + [f*log(1+r)]^3/3! + ... + [f*log(1+r)]^ORDER/ORDER!`
/// the result is `x * y`
///
/// # Arguments
///
/// * `interest` - `Permill` for the interest rate
/// * `exponent` - `FixedU128` for the exponent
///
/// # Returns
///
/// Approximation of (1+`interest`)^`exponent`
///
pub fn one_plus_interest_pow_fixed(interest: Permill, exp: FixedU128) -> FixedU128 {
    let one_plus_interest_base = FixedU128::saturating_from_rational(
        interest.deconstruct() as u128,
        Permill::ACCURACY as u128,
    )
    .saturating_add(FixedU128::one());

    let exp_int = exp.trunc().into_inner().div(FixedU128::DIV) as usize;
    let exp_frac = Perquintill::from_parts(exp.frac().into_inner() as u64);

    let base_pow_int = one_plus_interest_base.saturating_pow(exp_int);
    let base_pow_frac = one_plus_interest_pow_frac(interest, exp_frac);

    base_pow_int.mul(base_pow_frac)
}

// computes integral of integral at + b dt from x to y = a (y^2/2 - x^2/2) + b (y - x)
pub fn amm_eval_inner<
    Number: CheckedAdd + CheckedSub + CheckedMul + CheckedNeg + AtLeast32BitUnsigned + Copy,
>(
    x: Number,
    y: Number,
    a: Number,
    b: Number,
) -> Option<Number> {
    if x == y {
        return Some(Number::zero());
    }
    let lower_bound = y.min(x);
    let upper_bound = y.max(x);
    let upper_bound_sq = upper_bound.checked_mul(&upper_bound);
    let lower_bound_sq = lower_bound.checked_mul(&lower_bound);
    let first_term_coeff = a.div(2u32.into());

    // squared diff between two Option<Number>: upper_bound_sq - lower_bound_sq
    let diff_sq = upper_bound_sq.and_then(|upper_| lower_bound_sq.map(|lower_| upper_.sub(lower_)));
    let diff = upper_bound.sub(lower_bound);
    let first_term = diff_sq.and_then(|diff_sq| diff_sq.checked_mul(&first_term_coeff));
    let second_term = diff.checked_mul(&b);

    first_term
        .and_then(|first_term_| {
            second_term.map(|second_term_| first_term_.checked_add(&second_term_))
        })
        .flatten()
}

#[cfg(test)]
mod numerical_tests {
    use parameterized::parameterized;
    use sp_runtime::traits::Zero;

    use super::*;

    #[parameterized(
        input = {
            (5u128, 10u128, 2u128, 4u128), // x < y
            (10u128, 5u128, 2u128, 4u128), // x > y
            (10u128, 10u128, 2u128, 4u128), // x = y
            (u128::MAX - 1, u128::MAX , 2u128, 4u128), // overflow
            (u128::MAX, u128::MAX , 2u128, 4u128), // x = y = u128::MAX
            (10u128, 10u128, 0u128, 0u128), // a = b = 0
            (10u128, 5u128, u128::MAX, u128::MAX), // overflow
            (10u128, 10u128, u128::MAX, u128::MAX), // zero
            (10u128, 5u128, 5u128, 2u128), // a = odd 
        },
        expected = {
            Some(95),
            Some(95),
            Some(0),
            None,
            Some(0),
            Some(0),
            None,
            Some(0),
            Some(160)

        }
    )]
    fn amm_eval_inner_base_test(input: (u128, u128, u128, u128), expected: Option<u128>) {
        let (x, y, a, b) = input;

        let result = amm_eval_inner(x, y, a, b);

        assert_eq!(result, expected);
    }

    #[test]
    fn log_approximation_is_accurate_up_to_14_dec_places() {
        let expected = Perquintill::from_float(0.139761942375158f64); // https://www.wolframalpha.com/input?i=ln%281+%2B+0.15%29
        let actual = natural_log_1_plus_x(Permill::from_percent(15));
        // quintillion = 1e18
        assert_eq!(
            actual.deconstruct().div(10_000),
            expected.deconstruct().div(10_000)
        )
    }

    #[test]
    fn log_approximation_is_accurate_with_zero() {
        let expected = Perquintill::zero();
        let actual = natural_log_1_plus_x(Permill::zero());
        assert_eq!(actual, expected)
    }

    #[test]
    fn interest_computation_is_accurate_up_to_15_dec_places() {
        let expected = FixedU128::from_float(1.02118558583419f64); //https://www.wolframalpha.com/input?i=0.0211856&assumption=%22ClashPrefs%22+-%3E+%7B%22Math%22%7D
        let actual =
            one_plus_interest_pow_frac(Permill::from_percent(15), Perquintill::from_percent(15));
        assert_eq!(
            actual.into_inner().div(10_000),
            expected.into_inner().div(10_000)
        )
    }

    #[test]
    fn interest_computation_is_accurate_with_zero_interest() {
        let expected = FixedU128::one(); //(1 + 0)^x  = 1
        let actual = one_plus_interest_pow_frac(Permill::zero(), Perquintill::from_percent(15));
        assert_eq!(actual, expected)
    }

    #[test]
    fn one_plus_interest_pow_fixed_works_with_zero_interest() {
        let expected = FixedU128::one(); // (1 + 0)^x = 1
        let actual = one_plus_interest_pow_fixed(Permill::zero(), FixedU128::from_float(1.15f64));
        assert_eq!(expected, actual)
    }

    #[test]
    fn one_plus_interest_pow_fixed_works_with_zero_exponent() {
        let expected = FixedU128::one(); // a^0 = 1
        let actual = one_plus_interest_pow_fixed(Permill::from_percent(10), FixedU128::zero());
        assert_eq!(expected, actual)
    }

    #[test]
    fn one_plus_interest_pow_fixed_works_with_int_exp() {
        let expected = FixedU128::from_float(1.404928f64);
        let actual =
            one_plus_interest_pow_fixed(Permill::from_percent(12), FixedU128::from_float(3.00f64));
        assert_eq!(expected, actual)
    }

    #[test]
    fn one_plus_interest_pow_fixed_accurate_with_frac_exp_16_dec_places() {
        let expected = FixedU128::from_float(1.026408276205842713427f64);
        let actual =
            one_plus_interest_pow_fixed(Permill::from_percent(12), FixedU128::from_float(0.23f64));
        assert_eq!(
            expected.into_inner().div(1000),
            actual.into_inner().div(1000)
        )
    }

    #[test]
    fn one_plus_interest_pow_fixed_accurate_up_to_16_dec() {
        let expected = FixedU128::from_float(1.478434805499594623f64);
        let actual =
            one_plus_interest_pow_fixed(Permill::from_percent(12), FixedU128::from_float(3.45f64));
        assert_eq!(
            expected.into_inner().div(1000),
            actual.into_inner().div(1000)
        )
    }
}
