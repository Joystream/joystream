import { css } from "@emotion/core";
import { typography, colors } from "./../../theme";

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
			display: grid;
			grid-template: auto / ${showChannel ? "45px auto" : "auto"};
			margin: 10px 0 0;
		`,
		avatar: css`
			grid-column: 1 / 1;
			width: 40px;
			height: 40px;
		`,
		textContainer: css`
			grid-column: ${showChannel ? "2 / 2" : "1 / 1"};
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
