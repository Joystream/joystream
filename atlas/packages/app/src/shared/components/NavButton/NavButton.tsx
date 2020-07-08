import React from "react";
import { SerializedStyles } from "@emotion/core";
import { NavButtonStyleProps, useCSS } from "./NavButton.style";
import { ChevronLeftIcon, ChevronRightIcon } from "../../icons";

type NavButtonProps = {
	direction: "right" | "left";
	outerCss: SerializedStyles | SerializedStyles[] | (SerializedStyles | undefined) | (SerializedStyles | undefined)[];
	onClick: (e: React.MouseEvent<HTMLButtonElement>) => void;
} & NavButtonStyleProps;

export default function NavButton({ direction = "right", onClick, outerCss, ...styleProps }: Partial<NavButtonProps>) {
	let styles = useCSS(styleProps);
	return (
		<button css={[styles, outerCss]} onClick={onClick}>
			{direction === "right" ? <ChevronRightIcon /> : <ChevronLeftIcon />}
		</button>
	);
}
