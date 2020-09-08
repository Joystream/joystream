import { ApiPromise } from '@polkadot/api';
import { Vec } from '@polkadot/types';
import { AccountId } from '@polkadot/types/interfaces';

const getValidators = async (api: ApiPromise) => {
  let [totalValidatorStake, slotStake, numberOfNominators, numberOfValidators] = [0, 0, 0, 0];
  const validatorIds = await api.query.staking.currentElected() as Vec<AccountId>;
  await Promise.all(validatorIds.map(async (id: AccountId, index: number) => {
    const nominators = (await api.derive.staking.info(id)).stakers?.others.toArray() || [];
    const totalStake = (await api.derive.staking.info(id)).stakers?.total.toNumber() || 0;
    numberOfValidators += 1;
    totalValidatorStake += totalStake;
    numberOfNominators += nominators.length;
    if (index === 0) { slotStake = totalStake; }
    if (slotStake > totalStake) { slotStake = totalStake; }
  }));
  return {
    numberOfValidators,
    totalValidatorStake,
    effectiveStake: slotStake * validatorIds.length,
    numberOfNominators
  };
};

const calculateRewards = (totalIssuance: number, effectiveStake: number): any => {
  let validatorRewards = 0;
  const [idealStakingRate, minimumInflation, maximumInflation, fallOff, eraLength, year] = [0.3, 0.025, 0.3, 0.05, 3600, (365.2425 * 24 * 60 * 60)];
  const stakingRate = effectiveStake / totalIssuance;
  if (stakingRate > 0.3) {
    validatorRewards = totalIssuance * (minimumInflation + (maximumInflation - minimumInflation) * 2 ** ((idealStakingRate - stakingRate) / fallOff)) * eraLength / year;
  } else if (stakingRate === 0.3) {
    validatorRewards = (totalIssuance * maximumInflation * eraLength) / year;
  } else {
    validatorRewards = (totalIssuance * minimumInflation + totalIssuance * (maximumInflation - minimumInflation) * (stakingRate / idealStakingRate)) * eraLength / year;
  }
  return {
    validatorRewardsPerEra: validatorRewards
  };
};

export default async (api: ApiPromise, totalIssuance: number): Promise<any> => {
  const { numberOfValidators, totalValidatorStake, effectiveStake, numberOfNominators } = await getValidators(api);
  const { validatorRewardsPerEra } = await calculateRewards(totalIssuance, effectiveStake);

  return {
    numberOfValidators,
    numberOfNominators,
    validatorRewardsPerWeek: validatorRewardsPerEra * 168,
    totalValidatorStake
  };
};
