import { colors, spacing, typography } from "../../theme"
import { makeStyles, StyleFn } from "../../utils"

const container: StyleFn = () => ({
	display: "flex",
	flexDirection: "column"
})

const headingContainer: StyleFn = () => ({
	display: "flex",
	justifyContent: "space-between",
	alignItems: "baseline",
	marginBottom: spacing.m,
	"& > h4": {
		fontSize: "1.25rem",
		margin: 0
	},
	"& > button": {
		fontSize: "0.875rem",
		padding: 0
	}
})

export const useCSS = () => ({
	container: makeStyles([container])({}),
	headingContainer: makeStyles([headingContainer])({})
})
