import { css } from "@emotion/core";
import { spacing, colors } from "../../theme";

export type AvatarStyleProps = {
	img?: string;
	size?: "small" | "default" | "large";
};

export let makeStyles = ({ img, size = "default" }: AvatarStyleProps) => {
	let width = size === "small" ? spacing.xs : size === "default" ? spacing.m : spacing.xl;
	return css`
		background-image: ${img ? `url(${img})` : `radial-gradient(${colors.gray[500]}, ${colors.gray[500]})`};
		background-size: cover;
		background-position: center;
		border-radius: 999px;
		min-width: ${width};
		min-height: ${width};
	`;
};
