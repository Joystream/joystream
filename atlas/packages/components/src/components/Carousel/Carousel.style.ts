import { StyleFn, makeStyles } from "../../utils"
import { spacing } from "../../theme"
export type CarouselStyleProps = {
	navTopPosition?: string
}

const container: StyleFn = () => ({
	position: "relative",
	display: "flex",
	alignItems: "center"
})
const innerContainer: StyleFn = () => ({
	display: "flex",
	overflow: "hidden",
	padding: "1rem"
})

const navLeft: StyleFn = () => ({
	order: -1,
	position: "relative",
	zIndex: 1,
	left: 48,
	minWidth: spacing.xxxxl,
	minHeight: spacing.xxxxl,
	marginTop: -80
})

const navRight: StyleFn = () => ({
	position: "relative",
	zIndex: 1,
	right: 48,
	minWidth: spacing.xxxxl,
	minHeight: spacing.xxxxl,
	marginTop: -80
})

export const useCSS = (props: CarouselStyleProps) => ({
	container: makeStyles([container])(props),
	innerContainer: makeStyles([innerContainer])(props),
	navLeft: makeStyles([navLeft])(props),
	navRight: makeStyles([navRight])(props)
})
