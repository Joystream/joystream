import React, { useState, useRef, useEffect } from "react"
import { makeStyles, TextFieldStyleProps } from "./TextField.style"
import { colors } from "./../../theme"
import { IconProp } from "@fortawesome/fontawesome-svg-core"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"

type TextFieldProps = {
  label: string
  value?: string,
  icon?: IconProp
  iconPosition?: "right" | "left"
  disabled?: boolean
  onClick?: (e: React.MouseEvent<HTMLDivElement>) => void
  onChange?: (e: React.ChangeEvent) => void
} & TextFieldStyleProps

export default function TextField({
  label,
  value = "",
  icon = null,
  iconPosition = "right",
  disabled = false,
  onClick,
  onChange,
  ...styleProps
}: TextFieldProps) {

  const inputRef = useRef(null)
  const [isActive, setIsActive] = useState(!!value)
  const [inputTextValue, setInputTextValue] = useState(value)
  const styles = makeStyles({ isActive, ...styleProps })

  useEffect(() => {
    if (isActive) {
      inputRef.current.focus()
    }
    else {
      inputRef.current.blur()
    }
  }, [isActive, inputRef]);

  function onTextFieldClick() {
    setIsActive(true)
  }

  function onInputTextBlur() {
    setIsActive(false)
  }

  function onInputTextChange(event: React.FormEvent<HTMLInputElement>): React.ChangeEventHandler {
    if (disabled) return
    setInputTextValue(event.currentTarget.value)
  }
  
  return (
    <div css={styles.container} onClick={onTextFieldClick}>
      <div css={styles.border}>
        <div
          css={styles.label}
          style={!inputTextValue && !isActive ? {} : {
            position: "absolute",
            top: "-8px",
            left: "5px",
            fontSize: "0.7rem"
          }}>
            {label}
        </div>
        <input
          css={styles.input}
          style={{ display: !!inputTextValue || isActive ? "block" : "none"}}
          ref={inputRef}
          type="text"
          value={inputTextValue}
          onChange={disabled ? null : onInputTextChange}
          onBlur={onInputTextBlur}
        />
      </div>
    </div>
  )
}
