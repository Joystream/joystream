import { Balance } from '@polkadot/types/interfaces';
import { createMock } from '@joystream/types';

export const Zero = createMock('Balance', 0);
export const One = createMock('Balance', 1);

export const Add = (x: Balance, y: Balance): Balance => createMock('Balance', x.add(y));
export const Sub = (x: Balance, y: Balance): Balance => createMock('Balance', x.sub(y));
export const Sum = (balances: Balance[]): Balance => balances.reduce(Add, Zero);

export const Avg = (xs: Balance[]): Balance =>
  xs[0] === undefined ? Zero : createMock('Balance', Sum(xs).divn(xs.length));

export const AvgDelta = (xs: Balance[]): Balance => {
  if (xs.length < 2) {
    return One;
  }

  const pairs: Balance[] = [];

  xs.forEach((x, i) => {
    if (i > 0) {
      pairs.push(Sub(x, xs[i - 1]));
    }
  });

  return Avg(pairs);
};

// An average value to 'step' up balances, like on the nudge controls for a slider
export const Step = (xs: Balance[], ticks = 10): Balance => createMock('Balance', Avg(xs).divn(ticks));
export const Min = (x: Balance, min: Balance = One): Balance => x.gte(min) ? x : min;
export const Sort = (xs: Balance[]): Balance[] => {
  xs.sort((a, b): number => {
    if (a.eq(b)) {
      return 0;
    } else if (a.gt(b)) {
      return 1;
    }
    return -1;
  });
  return xs;
};
