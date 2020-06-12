import { StyleFn, makeStyles } from "../../utils";
import { colors, typography } from "../../theme";

export type ChannelPreviewStyleProps = {
	channelAvatar?: string;
	width?: number;
	height?: number;
};

const container: StyleFn = (_, { width = 200, height = 186 }) => ({
	backgroundColor: colors.gray[800],
	textAlign: "center",
	minWidth: width,
	minHeight: height,
	maxWidth: width,
	maxHeight: height,
});

const info: StyleFn = () => ({
	color: colors.gray[300],
	margin: `12px 0`,
	"& > h4": {
		margin: 0,
	},
	"& > span": {
		fontSize: typography.sizes.subtitle2,
	},
});

const avatar: StyleFn = () => ({
	width: 156,
	height: 156,
	margin: `-32px auto 0`,
});

export const useCSS = (props?: ChannelPreviewStyleProps) => ({
	container: makeStyles([container])(props),
	info: makeStyles([info])(props),
	avatar: makeStyles([avatar])(props),
});
