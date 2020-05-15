import React, { useState } from "react"
import { makeStyles, CheckboxStyleProps } from "./Checkbox.style"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { faCheck, faGripHorizontal } from "@fortawesome/free-solid-svg-icons"

type CheckboxProps = {
	label?: string
	disabled?: boolean
	icon?: "check" | "dash"
	onChange?: (e: React.ChangeEvent) => void
} & CheckboxStyleProps

export default function Checkbox({
	label = "",
	disabled = false,
	icon = "check",
	onChange = () => {},
	...styleProps
}: CheckboxProps) {
	const [pressed, setPressed] = useState(false)
	const styles = makeStyles({ ...styleProps, pressed, disabled })
	return (
		<div css={styles.outerContainer}>
			<div css={styles.innerContainer}>
				<input
					css={styles.input}
					type="checkbox"
					checked={pressed}
					disabled={disabled}
					onChange={e => {
						onChange(e)
						setPressed(!pressed)
					}}
				/>
				{pressed && styleProps.state !== "unselected" && (
					<FontAwesomeIcon icon={icon === "check" ? faCheck : faGripHorizontal} />
				)}
			</div>
		</div>
	)
}
