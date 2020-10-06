import React from 'react'
import { css } from '@emotion/core'
import { addDecorator, addParameters } from '@storybook/react'
import { withKnobs } from '@storybook/addon-knobs'
import { jsxDecorator } from 'storybook-addon-jsx'
import theme from './theme'
import { GlobalStyle } from '../components'

const wrapperStyle = css`
  padding: 10px;

  & > * + * {
    margin-left: 15px;
  }
`

const stylesWrapperDecorator = (styleFn) => (
  <div css={wrapperStyle}>
    <GlobalStyle />
    {styleFn()}
  </div>
)

addDecorator(withKnobs)
addDecorator(jsxDecorator)
addDecorator(stylesWrapperDecorator)

addParameters({
  options: {
    theme: theme,
  },
})
