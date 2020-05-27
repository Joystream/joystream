import React from "react";
import { ButtonStyleProps, useCSS } from "./Button.style";
import { IconProp } from "@fortawesome/fontawesome-svg-core";

type ButtonProps = {
	children?: React.ReactNode;
	icon?: IconProp;
	disabled?: boolean;
	onClick?: (e: React.MouseEvent<HTMLDivElement>) => void;
} & ButtonStyleProps;

export default function Button({
	children,
	icon,
	type = "primary",
	disabled = false,
	onClick,
	...styleProps
}: ButtonProps) {
	let styles = useCSS({ disabled, type, ...styleProps });
	return (
		<button css={styles.container} onClick={disabled ? null : onClick}>
			{children}
		</button>
	);
}
