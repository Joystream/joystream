import { typography, colors, spacing } from "../../theme";
import { StyleFn, makeStyles } from "../../utils";

export type SeriesPreviewStyleProps = {
	width?: number;
	height?: number;
	poster?: string;
};
const container: StyleFn = (_, { poster, width = 200, height = 396 }) => ({
	minHeight: height,
	minWidth: width,
	backgroundImage: poster
		? ` linear-gradient(to bottom, transparent, ${colors.black}), url(${poster})`
		: `linear-gradient(${colors.gray[400]}, ${colors.gray[700]})`,
	backgroundSize: "cover",
	display: "flex",
	alignItems: "flex-end",
	justifyContent: "center",
	color: colors.gray[300],
});

const info: StyleFn = () => ({
	display: "flex",
	flexDirection: "column",
	justifyContent: "center",
	alignItems: "center",
	marginBottom: spacing.l,
});

const text: StyleFn = () => ({
	display: "flex",
	flexDirection: "column",
	marginTop: spacing.xs,
	"& > h4": {
		margin: 0,
	},
	"& > span": {
		marginTop: spacing.xxs,
		fontSize: typography.sizes.subtitle2,
	},
});

const avatar: StyleFn = () => ({
	width: 46,
	height: 46,
});

export const useCSS = (props: SeriesPreviewStyleProps) => ({
	container: makeStyles([container])(props),
	info: makeStyles([info])(props),
	text: makeStyles([text])(props),
	avatar: makeStyles([avatar])(props),
});
