import styled from '@emotion/styled'
import { fluidRange } from 'polished'
import { Avatar } from '@/shared/components'
import theme from '@/shared/theme'

type ChannelHeaderProps = {
  coverPhotoURL: string | null
}
export const Header = styled.section<ChannelHeaderProps>`
  background-image: linear-gradient(0deg, #000000 10.85%, rgba(0, 0, 0, 0) 88.35%),
    ${(props) => `url(${props.coverPhotoURL})`};
  background-size: cover;
  background-position: center center;
  background-repeat: no-repeat;
  height: 430px;
  padding: 0 var(--global-horizontal-padding);
  margin: 0 calc(-1 * var(--global-horizontal-padding));
`
export const TitleSection = styled.div`
  display: flex;
  flex-direction: column;
  align-items: start;
  padding-top: ${theme.sizes.b10}px;
  @media (min-width: ${theme.breakpoints.small}) {
    flex-direction: row;
    align-items: center;
  }
`
export const TitleContainer = styled.div`
  max-width: 100%;
  @media screen and (min-width: ${theme.breakpoints.medium}) {
    max-width: 60%;
  }
  background-color: ${theme.colors.gray[800]};
  padding: 0 ${theme.sizes.b2}px;
`

export const Title = styled.h1`
  ${fluidRange({ prop: 'fontSize', fromSize: '32px', toSize: '40px' })};
  font-weight: bold;
  margin: -4px 0 0;
  line-height: 48px;
  @media screen and (min-width: ${theme.breakpoints.medium}) {
    line-height: 56px;
  }

  white-space: nowrap;
  text-overflow: ellipsis;
  overflow-x: hidden;
  max-width: 100%;
`

export const VideoSection = styled.section`
  margin-top: -100px;
`

export const StyledAvatar = styled(Avatar)`
  width: 128px;
  height: 128px;
  margin-bottom: ${theme.sizes.b3}px;

  @media (min-width: ${theme.breakpoints.small}) {
    width: 136px;
    height: 136px;
    margin: 0 ${theme.sizes.b6}px 0 0;
  }
`
