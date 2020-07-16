import { StyleFn, makeStyles } from "../../utils";
import { colors, typography } from "../../theme";

export type ChannelPreviewStyleProps = {
	channelAvatar: string;
	width: number;
	height: number;
};

const outerContainer: StyleFn = (_, { width = 200, height = 186 }) => ({
	minWidth: width,
	minHeight: height,
	maxWidth: width,
	maxHeight: height,
	paddingTop: "2rem",
});

const innerContainer: StyleFn = () => ({
	backgroundColor: colors.gray[800],
	color: colors.gray[300],
	display: "flex",
	flexDirection: "column",
	justifyContent: "flex-end",
});

const info: StyleFn = () => ({
	margin: `12px auto 10px`,
	textAlign: "center",
	"& > h2": {
		margin: 0,
		fontSize: "1rem",
	},
	"& > span": {
		fontSize: "0.875rem",
		lineHeight: 1.43,
	},
});

const avatar: StyleFn = () => ({
	width: 156,
	height: 156,
	position: "relative",
	margin: `-2rem auto 0`,
	zIndex: 2,
});

export const useCSS = (props: Partial<ChannelPreviewStyleProps>) => ({
	outerContainer: makeStyles([outerContainer])(props),
	innerContainer: makeStyles([innerContainer])(props),
	info: makeStyles([info])(props),
	avatar: makeStyles([avatar])(props),
});
