import React from 'react'
import { fluidRange } from 'polished'
import { css } from '@emotion/core'
import { Button, Header } from '@/shared/components'
import { navigate } from '@reach/router'
import sizes from '@/shared/theme/sizes'
import routes from '@/config/routes'

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
          ${fluidRange({ prop: 'fontSize', fromSize: '40px', toSize: '72px' })};
          line-height: 0.94;
        }
        margin: 0 -${sizes.b8}px;
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
          variant="secondary"
          containerCss={css`
            width: 96px;
          `}
          // FIXME: remove after rebasing on navbar
          onClick={() => navigate(routes.browse())}
        >
          Share
        </Button>
      </div>
    </Header>
  )
}
export default Hero
