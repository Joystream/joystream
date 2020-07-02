import React from "react";
import { SerializedStyles } from "@emotion/core";
import { useCSS, NavButtonStyleProps } from "./NavButton.style";
import ChevronRightIcon from "../../../assets/chevron-right-big.svg";
import ChevronLeftIcon from "../../../assets/chevron-left-big.svg";

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
