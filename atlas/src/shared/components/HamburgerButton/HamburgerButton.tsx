import React from 'react'
import { SerializedStyles } from '@emotion/core'
import { useCSS } from './HamburgerButton.style'

type HamburgerButtonProps = {
  active: boolean
  onClick: (e: React.MouseEvent<HTMLElement>) => void
  outerStyles?: SerializedStyles
}

const HamburgerButton: React.FC<HamburgerButtonProps> = ({ active, onClick, outerStyles }) => {
  const styles = useCSS({ active })

  return (
    <div css={[styles.hamburger, outerStyles]} onClick={onClick}>
      <span css={styles.hamburgerBox}>
        <span css={styles.hamburgerInner} />
      </span>
    </div>
  )
}

export default HamburgerButton
