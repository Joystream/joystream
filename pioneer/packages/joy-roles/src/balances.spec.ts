import { Balance } from '@polkadot/types/interfaces';
import { createType } from '@joystream/types';
import { Avg, AvgDelta, Min, Step, Sum } from './balances';

describe('Balance arithmetic', (): void => {
  it('Can calculate a sum', (): void => {
    const input: Balance[] = [];

    for (let i = 0; i < 10; i++) {
      input.push(createType('Balance', i));
    }

    expect(Sum(input).toNumber()).toEqual(45);
  });

  it('Can calculate an average', (): void => {
    const input: Balance[] = [];

    for (let i = 0; i < 10; i++) {
      input.push(createType('Balance', i));
    }

    expect(Avg(input).toNumber()).toEqual(4);
  });

  it('Can calculate an average delta', (): void => {
    const input: Balance[] = [];

    for (let i = 0; i < 10; i++) {
      input.push(createType('Balance', i));
    }

    expect(AvgDelta(input).toNumber()).toEqual(1);
  });

  it('Can calculate a step value with large numbers', (): void => {
    const input: Balance[] = [];

    for (let i = 0; i < 10; i++) {
      input.push(createType('Balance', i * 10));
    }

    expect(Step(input).toNumber()).toEqual(4);
  });

  it('Can calculate a step value with small numbers', (): void => {
    const input: Balance[] = [];

    for (let i = 0; i < 10; i++) {
      input.push(createType('Balance', i));
    }

    expect(Min(Step(input)).toNumber()).toEqual(1);
  });
});
