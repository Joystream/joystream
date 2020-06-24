import { colors, spacing, typography } from "../../theme"
import { makeStyles, StyleFn } from "../../utils"

const container: StyleFn = () => ({
	marginBottom: spacing.xxl,
	padding: spacing.m,
	display: "flex",
	flexDirection: "column"
})

const headingContainer: StyleFn = () => ({
	display: "flex",
	justifyContent: "space-between",
	alignItems: "baseline",
	"& > h4": {
		fontSize: typography.sizes.h4,
		marginBlock: spacing.m,
		marginLeft: spacing.m
	}
})

export const useCSS = () => ({
	container: makeStyles([container])({}),
	headingContainer: makeStyles([headingContainer])({})
})
