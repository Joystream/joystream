import React from 'react';
import BN from 'bn.js';

type PluralizeProps = {
  count: number | BN;
  singularText: string;
  pluralText?: string;
}

export function Pluralize (props: PluralizeProps) {
  let { count, singularText, pluralText } = props;

  if (!count) {
    count = 0;
  } else {
    count = typeof count !== 'number'
      ? count.toNumber()
      : count;
  }

  const plural = () => !pluralText
    ? singularText + 's'
    : pluralText;

  const text = count === 1
    ? singularText
    : plural();

  return <>{count} {text}</>;
}
