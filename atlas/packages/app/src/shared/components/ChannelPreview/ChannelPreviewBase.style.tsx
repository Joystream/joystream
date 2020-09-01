import { colors } from '../../theme'
import styled from '@emotion/styled'

const imageTopOverflow = '2rem'

export const OuterContainer = styled.article`
  width: 200px;
  height: ${`calc(186px + ${imageTopOverflow})`};
  padding-top: ${imageTopOverflow};
`

export const InnerContainer = styled.div`
  background-color: ${colors.gray[800]};
  color: ${colors.gray[300]};
  display: flex;
  flex-direction: column;
  height: 100%;
`

export const Info = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;

  margin: 12px auto 10px;
`

export const AvatarContainer = styled.div`
  width: 156px;
  height: 156px;
  position: relative;
  margin: -${imageTopOverflow} auto 0;
  z-index: 2;
`
