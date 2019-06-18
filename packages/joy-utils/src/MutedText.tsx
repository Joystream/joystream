import React from 'react';

type Props = {
  children?: React.ReactNode,
  smaller?: boolean
};

function getClassNames (props: Props): string {
  const { smaller = false } = props;
  return `grey text ${smaller ? 'smaller' : ''}`;
}

export const MutedSpan = (props: Props) =>
  <span className={getClassNames(props)}>{props.children}</span>;

export const MutedDiv = (props: Props) =>
  <div className={getClassNames(props)}>{props.children}</div>;
