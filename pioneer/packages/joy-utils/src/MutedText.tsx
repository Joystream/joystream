import React from 'react';

type Props = React.PropsWithChildren<{
  smaller?: boolean;
  className?: string;
  style?: React.CSSProperties;
}>;

function getClassNames (props: Props): string {
  const { smaller = false, className } = props;
  return `grey text ${smaller ? 'smaller' : ''} ${className}`;
}

export const MutedSpan = (props: Props) => {
  const { style, children } = props;
  return <span className={getClassNames(props)} style={style}>{children}</span>;
};

export const MutedDiv = (props: Props) => {
  const { style, children } = props;
  return <div className={getClassNames(props)} style={style}>{children}</div>;
};
