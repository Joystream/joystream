// Copyright 2017-2019 @polkadot/react-components authors & contributors
// This software may be modified and distributed under the terms
// of the Apache-2.0 license. See the LICENSE file for details.

import { BareProps } from '../types';

import BN from 'bn.js';
import React from 'react';
import { Pie } from 'react-chartjs-2';
import { bnToBn } from '@polkadot/util';

interface Value {
  colors: string[];
  label: string;
  value: number | BN;
}

interface Props extends BareProps {
  size?: number;
  values: Value[];
}

interface Options {
  colorNormal: string[];
  colorHover: string[];
  data: number[];
  labels: string[];
}

export default function PieChart ({ className, style, values }: Props): React.ReactElement<Props> {
  const options: Options = {
    colorNormal: [],
    colorHover: [],
    data: [],
    labels: []
  };

  values.forEach(({ colors: [normalColor = '#00f', hoverColor], label, value }): void => {
    options.colorNormal.push(normalColor);
    options.colorHover.push(hoverColor || normalColor);
    options.data.push(bnToBn(value).toNumber());
    options.labels.push(label);
  });

  return (
    <div
      className={className}
    >
      <Pie
        legend={{
          display: false
        }}
        options={{
          maintainAspectRatio: false
        }}
        data={{
          labels: options.labels,
          datasets: [{
            data: options.data,
            backgroundColor: options.colorNormal,
            hoverBackgroundColor: options.colorHover
          }]
        }}
      />
    </div>
  );
}
