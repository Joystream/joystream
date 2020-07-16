import React from "react";
import { TagButtonStyleProps, useCSS } from "./TagButton.style";

type TagButtonProps = {
	children: React.ReactNode;
	onClick?: (e: React.MouseEvent<HTMLDivElement>) => void;
} & TagButtonStyleProps;

export default function TagButton({ children, onClick, ...styleProps }: TagButtonProps) {
	let styles = useCSS(styleProps);
	return (
		<div css={styles} onClick={onClick}>
			{children}
		</div>
	);
}
