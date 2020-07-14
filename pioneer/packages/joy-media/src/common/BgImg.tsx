import React, { CSSProperties } from 'react';

type Props = {
  url: string;
  size?: number;
  width?: number;
  height?: number;
  circle?: boolean;
  className?: string;
  style?: CSSProperties;
};

export function BgImg (props: Props) {
  let { url, width, height, size, circle, className, style } = props;

  const fullClass = 'JoyBgImg ' + className;

  let fullStyle: CSSProperties = {
    backgroundImage: `url(${url})`
  };

  if (!width || !height) {
    width = size;
    height = size;
  }

  fullStyle = Object.assign(fullStyle, {
    width,
    height,
    minWidth: width,
    minHeight: height
  });

  if (circle) {
    fullStyle = Object.assign(fullStyle, {
      borderRadius: '50%'
    });
  }

  fullStyle = Object.assign(fullStyle, style);

  return <div className={fullClass} style={fullStyle} />;
}
