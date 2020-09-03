import React, { useState } from 'react'
import { StyledToggleButton, ToggleButtonStyleProps } from './ToggleButton.styles'

import type { ButtonProps } from '../Button/Button'

type ToggleButtonProps = ButtonProps & Omit<ToggleButtonStyleProps, 'pressedDown'>
const ToggleButton: React.FC<Partial<ToggleButtonProps>> = ({ onClick, children, ...buttonProps }) => {
  const [pressedDown, setPressedDown] = useState(false)
  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (onClick) {
      onClick(e)
    }
    setPressedDown(!pressedDown)
  }
  return (
    <StyledToggleButton onClick={handleClick} pressedDown={pressedDown} {...buttonProps}>
      {children}
    </StyledToggleButton>
  )
}
export default ToggleButton
