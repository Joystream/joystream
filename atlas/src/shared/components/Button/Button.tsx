import React from 'react'
import { SerializedStyles } from '@emotion/core'
import { ButtonStyleProps, StyledButton, StyledIcon } from './Button.style'
import type { IconType } from '../Icon'

export type ButtonProps = {
  icon: IconType
  disabled: boolean
  containerCss: SerializedStyles
  className: string
  onClick: (e: React.MouseEvent<HTMLButtonElement>) => void
} & Omit<ButtonStyleProps, 'clickable' | 'hasText'>

const Button: React.FC<Partial<ButtonProps>> = ({
  children,
  icon,
  variant = 'primary',
  disabled = false,
  full = false,
  size = 'regular',
  containerCss,
  className,
  onClick,
}) => {
  const clickable = !!onClick
  const hasText = !!children
  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (!onClick) return
    onClick(e)
  }

  return (
    <StyledButton
      css={containerCss}
      className={className}
      onClick={handleClick}
      disabled={disabled}
      variant={variant}
      clickable={clickable}
      hasText={hasText}
      full={full}
      size={size}
    >
      {icon && <StyledIcon name={icon} />}
      {children && <span>{children}</span>}
    </StyledButton>
  )
}

export default Button
