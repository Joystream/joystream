import { css, Global } from '@emotion/core'
import emotionNormalize from 'emotion-normalize'
import { typography, colors } from '../../theme'
import React from 'react'

const globalStyles = css`
  ${emotionNormalize};

  body {
    font-family: ${typography.fonts.base};
    background: ${colors.black};
    color: ${colors.gray[500]};
  }

  *,
  *::after,
  *::before {
    box-sizing: border-box;
  }

  h1,
  h2,
  h3,
  h4,
  h5,
  h6 {
    font-family: ${typography.fonts.headers};
    color: ${colors.white};
  }
`

const GlobalStyle: React.FC = () => <Global styles={globalStyles} />

export default GlobalStyle
