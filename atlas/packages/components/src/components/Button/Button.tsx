import React from "react";
import { SerializedStyles } from "@emotion/core";
import { ButtonStyleProps, useCSS } from "./Button.style";
import BlockIcon from "../../../assets/block.svg";

type ButtonProps = {
	children?: React.ReactNode;
	icon?: boolean;
	disabled?: boolean;
	containerCss: SerializedStyles;
	onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
} & ButtonStyleProps;

const Button: React.FC<Partial<ButtonProps>> = ({
	children,
	icon,
	type = "primary",
	disabled = false,
	containerCss,
	onClick = () => {},
	...styleProps
}) => {
	let styles = useCSS({ disabled, type, children, ...styleProps });
	return (
		<button css={[styles.container, containerCss]} onClick={onClick} disabled={disabled}>
			{icon && <BlockIcon css={styles.icon} />}
			{children}
		</button>
	);
};

export default Button;
