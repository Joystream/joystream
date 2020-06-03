import { StyleFn, makeStyles } from "./../../utils/style-reducer"
import { colors, log } from "../../theme"

export type CheckboxStyleProps = {
	labelPosition?: "end" | "start" | "top" | "bottom"
	caption?: string
	error?: boolean
	selected?: boolean
	disabled?: boolean
}

const fillFromProps: StyleFn = (styles, { disabled, error, selected }) => {
	let fill = error
		? colors.error
		: selected && disabled
		? colors.gray[700]
		: selected
		? colors.blue[500]
		: "transparent"

	return {
		...styles,
		backgroundColor: fill
	}
}

const borderColorFromProps: StyleFn = (styles, { disabled, error, selected }) => {
	let borderColor = error
		? colors.error
		: selected && disabled
		? colors.gray[700]
		: disabled
		? colors.gray[400]
		: selected
		? colors.blue[500]
		: colors.gray[300]

	return {
		...styles,
		borderColor
	}
}

const shadowFromProps: StyleFn = (styles, { disabled, error, selected }) => {
	let shadow = error || disabled ? "transparent" : selected ? colors.blue[900] : colors.gray[800]
	return {
		...styles,
		backgroundColor: shadow
	}
}

const outerContainer: StyleFn = (_, { disabled, error, selected }) => ({
	borderRadius: "999px",
	color: disabled ? colors.gray[400] : colors.white,
	maxWidth: "2rem",
	maxHeight: "2rem",
	width: "2rem",
	height: "2rem",
	display: "flex",
	justifyContent: "center",
	alignItems: "center",
	"&:focus-within": shadowFromProps({}, { disabled, error, selected }),
	"&:hover": disabled ? {} : shadowFromProps({}, { disabled, error, selected })
})

const innerContainer: StyleFn = (_, { disabled, error, selected }) => ({
	position: "relative",
	borderWidth: "1px",
	borderStyle: "solid",
	backgroundColor: selected ? fillFromProps({}, { disabled, error, selected }).backgroundColor : "transparent",
	width: "1.065rem",
	height: "1.065rem",
	maxWidth: "1.065rem",
	maxHeight: "1.065rem",
	textAlign: "center",
	[`& > input[type="checkbox"]:checked`]: {
		borderColor: !selected ? colors.white : borderColorFromProps({}, { disabled, error, selected }).borderColor,
		...fillFromProps({}, { disabled, error, selected })
	},
	"&:active": fillFromProps({}, { disabled, error, selected })
})

const input: StyleFn = () => ({
	position: "absolute",
	top: 0,
	bottom: 0,
	left: 0,
	right: 0,
	opacity: 0,
	width: "100%",
	height: "100%",
	padding: "unset",
	margin: "unset",
	border: "unset"
})

const icon: StyleFn = () => ({
	verticalAlign: "middle"
})

export const useCSS = ({ selected, error, disabled }: CheckboxStyleProps) => {
	const props = { selected, error, disabled }
	return {
		outerContainer: makeStyles([outerContainer])(props),
		innerContainer: makeStyles([innerContainer, borderColorFromProps])(props),
		input: makeStyles([input])(props),
		icon: makeStyles([icon])(props)
	}
}
