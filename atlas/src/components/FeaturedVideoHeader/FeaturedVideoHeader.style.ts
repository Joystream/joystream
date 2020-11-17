import styled from '@emotion/styled'
import { fluidRange } from 'polished'

import { Avatar, Button } from '@/shared/components'
import { breakpoints, colors, sizes, spacing, typography } from '@/shared/theme'
import { Link } from '@reach/router'
import { css } from '@emotion/core'

export const Container = styled.section`
  position: relative;

  // because of the fixed aspect ratio, as the viewport width grows, the media will occupy more height as well
  // so that the media doesn't take too big of a portion of the space, we let the content overlap the media via a negative margin
  @media screen and (min-width: ${breakpoints.small}) {
    margin-bottom: -75px;
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

export const Media = styled.div`
  width: 100%;
  height: 0;
  padding-top: 56.25%;
  position: relative;
`

const absoluteMediaCss = css`
  position: absolute;
  top: 0;
  right: 0;
  bottom: 0;
  left: 0;
`

export const PlayerContainer = styled.div`
  ${absoluteMediaCss};
`

export const GradientOverlay = styled.div`
  ${absoluteMediaCss};

  // as the content overlaps the media more and more as the viewport width grows, we need to hide some part of the media with a gradient
  // this helps with keeping a consistent background behind a page content - we don't want the media to peek out in the content spacing
  background-image: linear-gradient(0deg, black 0%, rgba(0, 0, 0, 0) 20%);
  @media screen and (min-width: ${breakpoints.small}) {
    background-image: linear-gradient(0deg, black 0%, rgba(0, 0, 0, 0) 50%);
  }
  @media screen and (min-width: ${breakpoints.medium}) {
    background-image: linear-gradient(0deg, black 0%, rgba(0, 0, 0, 0) 70%);
  }
  @media screen and (min-width: ${breakpoints.large}) {
    background-image: linear-gradient(0deg, black 0%, black 20%, rgba(0, 0, 0, 0) 90%);
  }
  @media screen and (min-width: ${breakpoints.xlarge}) {
    background-image: linear-gradient(0deg, black 0%, black 25%, rgba(0, 0, 0, 0) 90%);
  }
  @media screen and (min-width: ${breakpoints.xxlarge}) {
    background-image: linear-gradient(0deg, black 0%, black 30%, rgba(0, 0, 0, 0) 90%);
  }
`

export const InfoContainer = styled.div`
  position: relative;
  margin-top: -${spacing.xxl};
  padding-bottom: ${spacing.xs};

  @media screen and (min-width: ${breakpoints.small}) {
    position: absolute;
    margin: 0;
    padding: 0;
    bottom: 15%;
    max-width: 80%;
  }

  @media screen and (min-width: ${breakpoints.medium}) {
    bottom: 30%;
    max-width: 60%;
  }

  @media screen and (min-width: ${breakpoints.large}) {
    bottom: 35%;
    max-width: 40%;
  }

  @media screen and (min-width: ${breakpoints.xlarge}) {
    bottom: 45%;
  }

  @media screen and (min-width: ${breakpoints.xxlarge}) {
    bottom: 60%;
  }
`

export const ChannelLink = styled(Link)`
  margin-bottom: ${spacing.m};
  display: inline-block;
`

export const StyledAvatar = styled(Avatar)`
  width: 64px;
  height: 64px;
  @media screen and (min-width: ${breakpoints.medium}) {
    width: 88px;
    height: 88px;
  }
`

export const TitleContainer = styled.div`
  a {
    text-decoration: none;
  }
  margin-bottom: ${spacing.xxl};
  @media screen and (min-width: ${breakpoints.medium}) {
    margin-bottom: ${spacing.xxxl};
  }

  h2 {
    ${fluidRange({ prop: 'fontSize', fromSize: '40px', toSize: '60px' })};
    ${fluidRange({ prop: 'lineHeight', fromSize: '48px', toSize: '68px' })};
    font-family: ${typography.fonts.headers};
    font-weight: 700;
    margin: 0 0 ${spacing.s} 0;
    @media screen and (min-width: ${breakpoints.medium}) {
      margin-bottom: ${spacing.m};
    }
  }

  span {
    ${fluidRange({ prop: 'fontSize', fromSize: '14px', toSize: '28px' })};
    ${fluidRange({ prop: 'lineHeight', fromSize: '20px', toSize: '30px' })};
    color: ${colors.white};
  }
`

export const ButtonsContainer = styled.div`
  transition: opacity 200ms;
  opacity: 0;

  &.fade-enter-done {
    opacity: 1;
  }
`

export const PlayButton = styled(Button)`
  width: 116px;
`

export const SoundButton = styled(Button)`
  margin-left: ${sizes.b4}px;
`
