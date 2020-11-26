import { IDEAL_STAKING_RATE, MIN_INFLATION_RATE, MAX_INFLATION_RATE, FALL_OFF_RATE } from '../consts/staking';

// See: https://github.com/Joystream/helpdesk/tree/master/roles/validators#rewards-on-joystream for reference
export function calculateValidatorsRewardsPerEra (
  totalValidatorsStake: number,
  totalIssuance: number,
  minutesPerEra = 60
): number {
  let validatorsRewardsPerYear = 0;
  const stakingRate = totalValidatorsStake / totalIssuance;
  const minutesPerYear = 365.2425 * 24 * 60;

  if (stakingRate > IDEAL_STAKING_RATE) {
    validatorsRewardsPerYear =
      totalIssuance * (
        MIN_INFLATION_RATE + (
          (MAX_INFLATION_RATE - MIN_INFLATION_RATE) *
          (2 ** ((IDEAL_STAKING_RATE - stakingRate) / FALL_OFF_RATE))
        )
      );
  } else if (stakingRate === IDEAL_STAKING_RATE) {
    validatorsRewardsPerYear = totalIssuance * MAX_INFLATION_RATE;
  } else {
    validatorsRewardsPerYear =
      totalIssuance * (
        MIN_INFLATION_RATE +
        (MAX_INFLATION_RATE - MIN_INFLATION_RATE) * (stakingRate / IDEAL_STAKING_RATE)
      );
  }

  return validatorsRewardsPerYear / minutesPerYear * minutesPerEra;
}
