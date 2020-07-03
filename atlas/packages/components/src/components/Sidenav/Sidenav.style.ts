import { theme, utils } from "../..";

export const SIDENAV_WIDTH = 56;
export const EXPANDED_SIDENAV_WIDTH = 360;

type SidenavStyleProps = {
	expanded: boolean;
};

const nav: utils.StyleFn = () => ({
	position: "fixed",
	top: 0,
	left: 0,
	bottom: 0,
	zIndex: 100,

	overflow: "hidden",

	padding: `${theme.spacing.xxl} ${theme.spacing.m}`,

	display: "flex",
	flexDirection: "column",
	alignItems: "flex-start",

	backgroundColor: theme.colors.blue[700],
	color: theme.colors.white,
});

const expandButton: utils.StyleFn = () => ({
	padding: "7px",
	margin: "-4px",
});

const drawerOverlay: utils.StyleFn<SidenavStyleProps> = (_, { expanded }) => ({
	position: "fixed",
	top: 0,
	right: 0,
	bottom: 0,
	left: 0,
	zIndex: 99,

	display: expanded ? "block" : "none",

	backgroundColor: "rgba(0, 0, 0, 0.5)",
});

const navItemsWrapper: utils.StyleFn = () => ({
	marginTop: "90px",
});

const navItemContainer: utils.StyleFn = () => ({
	":not(:first-child)": {
		marginTop: theme.spacing.xxxl,
	},
	display: "flex",
	flexDirection: "column",
});

const navItem: utils.StyleFn = () => ({
	display: "flex",
	alignItems: "center",
	"> span": {
		marginLeft: theme.spacing.xxl,
		fontWeight: "bold",
		fontFamily: theme.typography.fonts.headers,
		fontSize: theme.typography.sizes.h5,
		lineHeight: 1,
	},
});

const navSubitemsWrapper: utils.StyleFn = () => ({
	paddingLeft: `calc(${theme.typography.sizes.icon.xlarge} + ${theme.spacing.xxl})`,
	overflow: "hidden",
	"> div": {
		display: "flex",
		flexDirection: "column",
	},
});

const navSubitem: utils.StyleFn = () => ({
	fontSize: theme.typography.sizes.body2,
	fontFamily: theme.typography.fonts.base,
	marginTop: theme.spacing.xxl,
	":first-child": {
		marginTop: theme.spacing.xl,
	},
});

export const useSidenavCSS = (props: SidenavStyleProps) => ({
	nav: utils.makeStyles([nav])(props),
	expandButton: utils.makeStyles([expandButton])(props),
	drawerOverlay: utils.makeStyles([drawerOverlay])(props),
	navItemsWrapper: utils.makeStyles([navItemsWrapper])(props),
});

export const useNavItemCSS = (props: SidenavStyleProps) => ({
	navItemContainer: utils.makeStyles([navItemContainer])(props),
	navItem: utils.makeStyles([navItem])(props),
	navSubitemsWrapper: utils.makeStyles([navSubitemsWrapper])(props),
	navSubitem: utils.makeStyles([navSubitem])(props),
});
