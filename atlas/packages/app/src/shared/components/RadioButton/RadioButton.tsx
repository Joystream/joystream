import React from 'react'
import { Label, Input, StyledInput, RadioButtonStyleProps } from './RadioButton.style'

type RadioButtonProps = Partial<{
  label: string
}> &
  Omit<RadioButtonStyleProps, 'clickable'> &
  React.DetailedHTMLProps<React.InputHTMLAttributes<HTMLInputElement>, HTMLInputElement>

const RadioButton: React.FC<RadioButtonProps> = ({
  label,
  position = 'end',
  disabled,
  error,
  onClick,
  checked,
  ...props
}) => {
  const clickable = !!onClick
  const handleClick = (e: React.MouseEvent<HTMLInputElement>) => {
    if (onClick) {
      onClick(e)
    }
  }
  return (
    <Label position={position} clickable={clickable} disabled={disabled}>
      <StyledInput checked={checked} error={error} disabled={disabled}>
        <Input type="radio" onClick={handleClick} disabled={disabled} {...props} checked={checked} />
      </StyledInput>
      {label && <span>{label}</span>}
    </Label>
  )
}

export default RadioButton
