import React, { useState } from 'react'
import { StyledToggleButton } from './ToggleButton.styles'

import type { ButtonProps } from '../Button/Button'

type ToggleButtonProps = {
  controlled?: boolean
  toggled?: boolean
} & ButtonProps

const ToggleButton: React.FC<Partial<ToggleButtonProps>> = ({
  onClick,
  controlled = false,
  toggled: externalToggled = false,
  children,
  ...buttonProps
}) => {
  const [toggled, setToggled] = useState(false)

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (onClick) {
      onClick(e)
    }
    if (!controlled) {
      setToggled(!toggled)
    }
  }

  return (
    <StyledToggleButton onClick={handleClick} toggled={controlled ? externalToggled : toggled} {...buttonProps}>
      {children}
    </StyledToggleButton>
  )
}

export default ToggleButton
