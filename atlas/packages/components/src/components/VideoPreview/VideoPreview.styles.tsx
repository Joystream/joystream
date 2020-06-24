import { css } from "@emotion/core";
import { typography, colors, spacing } from "./../../theme";

export type VideoPreviewStyleProps = {
	showChannel: boolean;
	poster: string;
	width: number;
	darken: boolean;
	height: number;
	fade: string;
};

export let makeStyles = ({
	showChannel = false,
	width = 320,
	height = 190,
	poster = "",
	fade,
}: Partial<VideoPreviewStyleProps>) => {
	const withPoster = poster ? fade : `linear-gradient(${colors.gray[300]}, ${colors.gray[700]})`;

	return {
		container: css`
			color: ${colors.gray[300]};
		`,
		link: css`
			text-decoration: none;
		`,
		coverContainer: css`
			width: ${width}px;
			height: ${height}px;
		`,
		cover: css`
			width: 100%;
			height: 100%;
			background-image: ${withPoster};
			object-fit: cover;
		`,
		infoContainer: css`
			display: flex;
			margin-top: ${spacing.s};
		`,
		avatar: css`
			width: 40px;
			height: 40px;
		`,
		textContainer: css`
			margin-left: ${spacing.xs};
			line-height: 1.25;
			& > h3 {
				font-size: 1rem;
				font-family: ${typography.fonts.headers};
				margin: 0;
			}
			& > span {
				font-size: 0.875rem;
				line-height: 1.43;
				margin: 0;
			}

			span:first-of-type {
				margin-bottom: ${spacing.xs};
			}
		`,
		title: css`
			margin: 0;
			font-weight: ${typography.weights.bold};
			text-transform: capitalize;
			color: ${colors.white};
		`,
		channel: css`
			margin: 0.5rem 0;
			font-size: ${typography.sizes.subtitle2};
			display: block;
		`,
		meta: css`
			font-size: ${typography.sizes.subtitle2};
		`,
	};
};
