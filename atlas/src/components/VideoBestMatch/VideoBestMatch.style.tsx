import styled from '@emotion/styled'
import { colors, breakpoints as bp } from '@/shared/theme'

export const Container = styled.div`
  color: ${colors.gray[300]};
  padding-right: 2rem;
`

export const Content = styled.div`
  display: grid;
  grid-template-columns: minmax(50%, 650px) 1fr;
  grid-column-gap: 24px;

  @media (max-width: ${bp.mobile}) {
    grid-template-columns: 1fr;
  }
`
export const Poster = styled.img`
  width: 100%;
  max-height: 350px;
  object-fit: cover;
  object-position: center;

  :hover {
    cursor: pointer;
  }
`
export const TitleContainer = styled.div`
  max-width: 500px;
`
export const Title = styled.h1`
  font-size: 40px;
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
