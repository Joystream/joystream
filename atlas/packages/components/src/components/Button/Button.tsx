import React from "react";
import { makeStyles, ButtonStyleProps } from "./Button.style";
import { IconProp } from "@fortawesome/fontawesome-svg-core";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

type ButtonProps = {
	text?: string;
	icon?: IconProp;
	disabled?: boolean;
	onClick?: (e: React.MouseEvent<HTMLDivElement>) => void;
} & ButtonStyleProps;

export default function Button({ text = "", icon, disabled = false, onClick, ...styleProps }: ButtonProps) {
	let styles = makeStyles({ text, disabled, ...styleProps });
	console.log("styles", styles);
	return (
		<div css={styles} onClick={disabled ? null : onClick}>
			{text}
		</div>
	);
}
