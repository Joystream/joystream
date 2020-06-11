import { css } from "@emotion/core";
import { spacing, colors } from "../../theme";

export type AvatarStyleProps = {
	img?: string;
	size?: "small" | "default" | "large";
};

export let makeStyles = ({ img, size = "default" }: AvatarStyleProps) => {
	let width = size === "small" ? spacing.xs : size === "default" ? spacing.m : spacing.xl;
	return css`
		background-image: ${img ? `url(${img})` : `radial-gradient(${colors.blue[500]}, ${colors.blue[500]})`};
		background-size: cover;
		background-position: center;
		border-radius: 50%;
		min-width: ${width};
		min-height: ${width};
		max-width: ${width};
		max-height: ${width};
	`;
};
