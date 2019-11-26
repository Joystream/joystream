import React from 'react';

type Props = {
  url: string,
  className?: string
}

export function BgImg (props: Props) {
  const style = { backgroundImage: `url(${props.url})` };

  return <div className={`JoyBgImg ` + props.className} style={style} />
}