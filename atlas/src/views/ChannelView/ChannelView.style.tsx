import styled from '@emotion/styled'
import { fluidRange } from 'polished'
import { Avatar, Placeholder } from '@/shared/components'
import theme, { breakpoints } from '@/shared/theme'
import { css } from '@emotion/core'

const SM_TITLE_HEIGHT = '48px'
const TITLE_HEIGHT = '56px'

type CoverImageProps = {
  src: string
}

export const Header = styled.section`
  position: relative;
  margin-bottom: 60px;

  // because of the fixed aspect ratio, as the viewport width grows, the media will occupy more height as well
  // so that the media doesn't take too big of a portion of the space, we let the content overlap the media via a negative margin
  @media screen and (min-width: ${breakpoints.small}) {
    margin-bottom: -75px;
    padding-bottom: 0;
  }
  @media screen and (min-width: ${breakpoints.medium}) {
    margin-bottom: -200px;
  }
  @media screen and (min-width: ${breakpoints.large}) {
    margin-bottom: -250px;
  }
  @media screen and (min-width: ${breakpoints.xlarge}) {
    margin-bottom: -400px;
  }
  @media screen and (min-width: ${breakpoints.xxlarge}) {
    margin-bottom: -600px;
  }
`

export const MediaWrapper = styled.div`
  margin: 0 calc(-1 * var(--global-horizontal-padding));
  width: calc(100% + calc(2 * var(--global-horizontal-padding)));
`

export const CoverImage = styled.div<CoverImageProps>`
  width: 100%;
  height: 0;
  padding-top: 56.25%;
  background-repeat: no-repeat;
  background-position: center;
  background-attachment: local;
  background-size: cover;

  // as the content overlaps the media more and more as the viewport width grows, we need to hide some part of the media with a gradient
  // this helps with keeping a consistent background behind a page content - we don't want the media to peek out in the content spacing
  background-image: linear-gradient(0deg, black 0%, rgba(0, 0, 0, 0) 40%), url(${({ src }) => src});
  @media screen and (min-width: ${breakpoints.small}) {
    background-image: linear-gradient(0deg, black 0%, rgba(0, 0, 0, 0) 80%), url(${({ src }) => src});
  }
  @media screen and (min-width: ${breakpoints.medium}) {
    background-image: linear-gradient(0deg, black 0%, black 10%, rgba(0, 0, 0, 0) 70%), url(${({ src }) => src});
  }
  @media screen and (min-width: ${breakpoints.large}) {
    background-image: linear-gradient(0deg, black 0%, black 20%, rgba(0, 0, 0, 0) 90%), url(${({ src }) => src});
  }
  @media screen and (min-width: ${breakpoints.xlarge}) {
    background-image: linear-gradient(0deg, black 0%, black 30%, rgba(0, 0, 0, 0) 90%), url(${({ src }) => src});
  }
  @media screen and (min-width: ${breakpoints.xxlarge}) {
    background-image: linear-gradient(0deg, black 0%, black 40%, rgba(0, 0, 0, 0) 90%), url(${({ src }) => src});
  }
`

export const TitleSection = styled.div`
  position: absolute;
  display: flex;
  flex-direction: column;
  align-items: start;
  @media (min-width: ${theme.breakpoints.small}) {
    flex-direction: row;
    align-items: center;
  }

  width: 100%;

  max-width: 100%;
  top: 5%;

  @media screen and (min-width: ${breakpoints.small}) {
    top: 20%;
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
  line-height: ${SM_TITLE_HEIGHT};
  @media screen and (min-width: ${theme.breakpoints.medium}) {
    line-height: ${TITLE_HEIGHT};
  }

  white-space: nowrap;
  text-overflow: ellipsis;
  overflow-x: hidden;
  max-width: 100%;
`

export const VideoSection = styled.section`
  position: relative;
`

const avatarCss = css`
  width: 128px;
  height: 128px;
  margin-bottom: ${theme.sizes.b3}px;

  @media (min-width: ${theme.breakpoints.small}) {
    width: 136px;
    height: 136px;
    margin: 0 ${theme.sizes.b6}px 0 0;
  }
`

export const StyledAvatar = styled(Avatar)`
  ${avatarCss};
`

export const AvatarPlaceholder = styled(Placeholder)`
  ${avatarCss};
  border-radius: 100%;
`

export const TitlePlaceholder = styled(Placeholder)`
  width: 300px;
  height: ${SM_TITLE_HEIGHT};
  @media screen and (min-width: ${theme.breakpoints.medium}) {
    height: ${TITLE_HEIGHT};
  }
`
