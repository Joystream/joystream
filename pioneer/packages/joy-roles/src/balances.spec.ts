import { Balance } from '@polkadot/types/interfaces';
import { u128 } from '@polkadot/types'
import { Avg, AvgDelta, Min, Step, Sum } from './balances'

describe('Balance arithmetic', (): void => {
  it("Can calculate a sum", (): void => {
    const input: Balance[] = []
    for (let i = 0; i < 10; i++) {
      input.push(new u128(i))
    }

    expect(Sum(input).toNumber()).toEqual(45)
  });

  it("Can calculate an average", (): void => {
    const input: Balance[] = []
    for (let i = 0; i < 10; i++) {
      input.push(new u128(i))
    }

    expect(Avg(input).toNumber()).toEqual(4)
  });

  it("Can calculate an average delta", (): void => {
    const input: Balance[] = []
    for (let i = 0; i < 10; i++) {
      input.push(new u128(i))
    }

    expect(AvgDelta(input).toNumber()).toEqual(1)
  });

  it("Can calculate a step value with large numbers", (): void => {
    const input: Balance[] = []
    for (let i = 0; i < 10; i++) {
      input.push(new u128(i * 10))
    }

    expect(Step(input).toNumber()).toEqual(4)
  });

  it("Can calculate a step value with small numbers", (): void => {
    const input: Balance[] = []
    for (let i = 0; i < 10; i++) {
      input.push(new u128(i))
    }

    expect(Min(Step(input)).toNumber()).toEqual(1)
  });
})
