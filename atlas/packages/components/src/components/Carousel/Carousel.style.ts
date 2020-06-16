import { StyleFn, makeStyles } from "../../utils";

export type CarouselStyleProps = {
	navTopPosition?: string;
};

const container: StyleFn = () => ({
	position: "relative",
	display: "flex",
	alignItems: "center",
});
const innerContainer: StyleFn = () => ({
	display: "flex",
	overflow: "hidden",
	padding: "1rem",
});

const navLeft: StyleFn = () => ({
	order: -1,
});

const navRight: StyleFn = () => ({});

export const useCSS = (props: CarouselStyleProps) => ({
	container: makeStyles([container])(props),
	innerContainer: makeStyles([innerContainer])(props),
	navLeft: makeStyles([navLeft])(props),
	navRight: makeStyles([navRight])(props),
});
