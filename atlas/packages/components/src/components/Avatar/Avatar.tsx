import React from "react";
import { SerializedStyles } from "@emotion/core";
import { makeStyles, AvatarStyleProps } from "./Avatar.style";

export type AvatarProps = {
	onClick?: (e: React.MouseEvent) => void;
	outerStyles?: SerializedStyles;
} & AvatarStyleProps;

export default function Avatar({ onClick = () => {}, outerStyles, ...styleProps }: AvatarProps) {
	let styles = makeStyles(styleProps);
	return <div css={[styles, outerStyles]} onClick={onClick} />;
}
