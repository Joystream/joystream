import React from 'react'
import { baseStyle, variantStyles, TypographyVariant } from './Typography.style'

type TypographyProps = {
  variant: TypographyVariant
  className?: string
}

const variantToTag: Record<TypographyVariant, keyof JSX.IntrinsicElements> = {
  body1: 'p',
  body2: 'p',
  caption: 'caption',
  overhead: 'span',
  subtitle1: 'span',
  subtitle2: 'span',
  hero: 'h1',
  h1: 'h1',
  h2: 'h2',
  h3: 'h3',
  h4: 'h4',
  h5: 'h5',
  h6: 'h6',
}

const Typography: React.FC<TypographyProps> = ({ variant, className, children }) => {
  const Tag = variantToTag[variant]
  return (
    <Tag css={[baseStyle, variantStyles[variant]]} className={className}>
      {children}
    </Tag>
  )
}

export default Typography
