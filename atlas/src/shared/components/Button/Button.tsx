import React from 'react'
import { SerializedStyles } from '@emotion/core'
import { ButtonStyleProps, StyledButton, StyledIcon } from './Button.style'
import type { IconType } from '../Icon'

export type ButtonProps = {
  children?: React.ReactNode
  icon?: IconType
  disabled?: boolean
  containerCss?: SerializedStyles
  className?: string
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void
} & Omit<ButtonStyleProps, 'clickable' | 'hasText'>

const ButtonComponent: React.ForwardRefRenderFunction<HTMLButtonElement, ButtonProps> = (
  {
    children,
    icon,
    variant = 'primary',
    disabled = false,
    full = false,
    size = 'regular',
    containerCss,
    className,
    onClick,
  },
  ref
) => {
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
      ref={ref}
    >
      {icon && <StyledIcon name={icon} />}
      {children && <span>{children}</span>}
    </StyledButton>
  )
}

const Button = React.forwardRef(ButtonComponent)

Button.displayName = 'Button'

export default Button
