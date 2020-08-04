import React from 'react'
import { fluidRange } from 'polished'
import { css } from '@emotion/core'
import { Button, Header } from '@/shared/components'

type HeroProps = {
  backgroundImg: string
}

const Hero: React.FC<Partial<HeroProps>> = ({ backgroundImg }) => {
  return (
    <Header
      title="A user governed video platform"
      subtitle="Lorem ipsum sit amet, consectetur adipiscing elit. Proin non nisl sollicitudin, tempor diam."
      backgroundImg={backgroundImg}
      containerCss={css`
        font-size: 18px;
        line-height: 1.33;
        & h1 {
          ${fluidRange({ prop: 'font-size', fromSize: '40px', toSize: '72px' })};
          line-height: 0.94;
        }
      `}
    >
      <div
        css={css`
          display: flex;
          margin-top: 40px;
          & > * {
            margin-right: 1rem;
          }
        `}
      >
        <Button
          containerCss={css`
            width: 116px;
          `}
        >
          Play
        </Button>
        <Button
          type="secondary"
          containerCss={css`
            width: 96px;
          `}
        >
          Share
        </Button>
      </div>
    </Header>
  )
}
export default Hero
