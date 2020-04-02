import React from "react";
import { makeStyles, BannerStyleProps } from "./Banner.styles";

type BannerProps = {} & BannerStyleProps;

export default function Banner({ ...styleProps }: BannerProps) {
  let styles = makeStyles(styleProps);
  return <div css={styles}></div>;
}
