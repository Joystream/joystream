import React from "react";
import { makeStyles, AvatarStyleProps } from "./avatarStyle";

export type AvatarProps = {
  link: string;
} & AvatarStyleProps;

export default function Avatar({ link, ...styleProps }: AvatarProps) {
  let styles = makeStyles(styleProps);
  return (
    <a href={link}>
      <div css={styles}></div>
    </a>
  );
}
