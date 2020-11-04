import styled from '@emotion/styled'
import { fluidRange } from 'polished'
import { colors, breakpoints as bp } from '@/shared/theme'

export const Container = styled.div`
  color: ${colors.gray[300]};
  padding-right: 2rem;
`

export const Content = styled.div`
  display: grid;
  grid-template-columns: min(650px, 50%) 1fr;
  grid-column-gap: 24px;

  @media (max-width: ${bp.smallTablet}) {
    grid-template-columns: 1fr;
  }
`

export const PosterContainer = styled.div`
  position: relative;
  width: 100%;
  height: 0;
  max-height: 350px;
  padding-top: 56.25%;
  :hover {
    cursor: pointer;
  }
`
export const Poster = styled.img`
  position: absolute;
  width: 100%;
  height: 100%;
  top: 0;
  left: 0;
`
export const TitleContainer = styled.div`
  max-width: 500px;
`
export const Title = styled.h1`
  ${fluidRange({ prop: 'fontSize', fromSize: '32px', toSize: '40px' })};
  line-height: 1.2;
  margin: 0;
  margin-bottom: 12px;
`

export const InnerContainer = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding: 1.875rem 0;
`
