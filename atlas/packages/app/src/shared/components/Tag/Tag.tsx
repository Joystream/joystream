import React from "react";
import { TagStyleProps, useCSS } from "./Tag.style";

type TagProps = {
	children?: React.ReactNode;
} & TagStyleProps;

export default function Tag({ children, ...styleProps }: TagProps) {
	let styles = useCSS(styleProps);
	return <div css={styles}>{children}</div>;
}
