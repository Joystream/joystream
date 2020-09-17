import styled from '@emotion/styled'
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
  padding: 0 ${theme.sizes.b8}px;
`
export const TitleSection = styled.div`
  display: flex;
  align-items: center;
  padding-top: ${theme.sizes.b10}px;
`
export const Title = styled.h1`
  font-size: ${theme.typography.sizes.h2};
  font-weight: bold;
  max-width: 320px;
  display: inline-block;
`

export const VideoSection = styled.section`
  padding: 0 ${theme.sizes.b8}px;
  margin-top: -100px;
`
export const VideoSectionHeader = styled.h5`
  margin: 0 0 ${theme.spacing.m};
  font-size: ${theme.typography.sizes.h5};
`

export const VideoSectionGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
  grid-gap: ${theme.spacing.xl};
`
export const StyledAvatar = styled(Avatar)`
  max-width: 136px;
  margin-right: ${theme.sizes.b6}px;
`
