import { typography, colors } from "../../theme"
import { makeStyles, StyleFn } from "../../utils"
import { disabled, dimensionsFromProps } from "../../theme/fragments"

export type ButtonStyleProps = {
	text?: string
	type?: "primary" | "secondary" | "tertiary"
	full?: boolean
	size?: "regular" | "small" | "smaller"
	children?: React.ReactNode
	disabled?: boolean
}

const baseStyles: StyleFn = () => ({
	borderWidth: "1px",
	borderStyle: "solid",
	fontFamily: typography.fonts.headers,
	fontWeight: typography.weights.medium,
	display: "inline-flex",
	justifyContent: "center",
	alignItems: "center",
	color: colors.white,
	"&::selected": {
		background: "transparent"
	}
})
const colorFromType: StyleFn = (styles = {}, { type }: ButtonStyleProps) => {
	switch (type) {
		case "primary":
			return {
				...styles,
				backgroundColor: colors.blue[500],
				borderColor: colors.blue[500],

				"&:hover": {
					backgroundColor: colors.blue[700],
					borderColor: colors.blue[700],
					color: colors.white
				},
				"&:active": {
					backgroundColor: colors.blue[900],
					borderColor: colors.blue[900],
					color: colors.white
				}
			}

		case "secondary":
			return {
				...styles,
				backgroundColor: colors.black,
				borderColor: colors.blue[500],

				"&:hover": {
					borderColor: colors.blue[700],
					color: colors.blue[300]
				},

				"&:active": {
					borderColor: colors.blue[700],
					color: colors.blue[700]
				}
			}

		case "tertiary":
			return {
				...styles,
				backgroundColor: "transparent",
				borderColor: "transparent",
				color: colors.blue[500],
				"&:hover": {
					color: colors.blue[300]
				},
				"&:active": {
					color: colors.blue[700]
				}
			}

		default:
			return { ...styles }
	}
}
const paddingFromType: StyleFn = (
	styles,
	{
		size = "regular",
		children,
		full = false
	}: { size: "regular" | "small" | "smaller"; children?: React.ReactNode; full: boolean }
) => {
	const buttonHeight = size === "regular" ? "20px" : size === "small" ? "15px" : "10px"
	return {
		...styles,
		padding:
			size === "regular"
				? children
					? "14px 20px"
					: "14px"
				: size === "small"
				? children
					? "12px 14px"
					: "12px"
				: "10px",
		fontSize:
			size === "regular"
				? typography.sizes.button.large
				: size === "small"
				? typography.sizes.button.medium
				: typography.sizes.button.small
	}
}

const iconStyles: StyleFn = (styles, { children, size }) => {
	return {
		...styles,
		marginRight: children != null ? "10px" : "0",
		fontSize:
			size === "regular"
				? typography.sizes.icon.large
				: size === "small"
				? typography.sizes.icon.medium
				: typography.sizes.icon.small,

		flexShrink: 0,
		"& > *": {
			stroke: "currentColor"
		}
	}
}

export const useCSS = (props: ButtonStyleProps) => ({
	container: makeStyles([baseStyles, colorFromType, dimensionsFromProps, paddingFromType, disabled])(props),
	icon: makeStyles([iconStyles])(props)
})
