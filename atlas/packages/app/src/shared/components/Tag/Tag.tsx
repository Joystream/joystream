import React from 'react'
import { TagStyleProps, useCSS } from './Tag.style'

type TagProps = {
  children?: React.ReactNode
} & TagStyleProps

export default function Tag({ children }: TagProps) {
  const styles = useCSS()
  return <div css={styles}>{children}</div>
}
