import React, { CSSProperties } from 'react';

type Props = {
  url: string,
  size?: number,
  circle?: boolean,
  className?: string,
  style?: CSSProperties
};

export function BgImg (props: Props) {
  const { url, size, circle, className, style } = props;

  const fullClass = 'JoyBgImg ' + className;

  let fullStyle: CSSProperties = {
    backgroundImage: `url(${url})`,
  };

  if (size) {
    fullStyle = Object.assign(fullStyle, {
      width: size,
      height: size,
      minWidth: size,
      minHeight: size
    })
  }

  if (circle) {
    fullStyle = Object.assign(fullStyle, {
      borderRadius: '50%'
    })
  }

  fullStyle = Object.assign(fullStyle, style);

  return <div className={fullClass} style={fullStyle} />;
}