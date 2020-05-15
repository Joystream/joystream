import { css } from "@emotion/core"
import { colors } from "../../theme"

type CheckboxState = "error" | "selected" | "unselected"

export type CheckboxStyleProps = {
	labelPosition?: "end" | "start" | "top" | "bottom"
	caption?: string
	state?: CheckboxState
	pressed?: boolean
	disabled?: boolean
}

let colorFromState = (state: CheckboxState, disabled: boolean) => {
	switch (state) {
		case "error": {
			return {
				border: colors.error.second,
				shadow: "transparent",
				fill: colors.error.second
			}
		}
		case "selected": {
			return {
				shadow: disabled ? "transparent" : colors.blue[900],
				border: disabled ? colors.gray[700] : colors.blue[500],
				fill: disabled ? colors.gray[700] : colors.blue[500]
			}
		}
		case "unselected": {
			return {
				border: disabled ? colors.gray[400] : colors.gray[300],
				fill: "transparent",
				shadow: disabled ? "transparent" : colors.gray[800]
			}
		}
	}
}

export let makeStyles = ({ labelPosition, caption, state = "selected", pressed, disabled }: CheckboxStyleProps) => {
	let { fill, border, shadow } = colorFromState(state, disabled)
	return {
		outerContainer: css`
			border-radius: 999px;
			color: ${disabled ? colors.gray[400] : colors.white};
			max-width: 2rem;
			max-height: 2rem;
			width: 2rem;
			height: 2rem;
			display: flex;
			justify-content: center;
			align-items: center;

			&:focus-within {
				background-color: ${shadow};
			}
			&:hover {
				${disabled ? "" : `background-color: ${shadow}`}
			}
		`,
		innerContainer: css`
			position: relative;
			border-color: ${border};
			border-width: 1px;
			border-style: solid;
			background-color: ${pressed ? fill : "transparent"};
			width: 1.065rem;
			height: 1.065rem;
			max-height: 1.065rem;
			max-width: 1.065rem;
			text-align: center;

			& > input[type="checkbox"]:checked {
				border-color: ${state === "unselected" ? colors.white : border};
				background-color: ${fill};
			}
		`,
		input: css`
			position: absolute;
			top: 0;
			bottom: 0;
			left: 0;
			right: 0;
			opacity: 0;
			width: 100%;
			height: 100%;
			padding: unset;
			border: unset;
			margin: unset;
		`
	}
}
