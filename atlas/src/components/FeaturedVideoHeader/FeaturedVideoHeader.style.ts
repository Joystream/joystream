import styled from '@emotion/styled'
import { fluidRange } from 'polished'

import { Avatar, Button } from '@/shared/components'
import { breakpoints, colors, sizes, spacing, typography } from '@/shared/theme'
import { Link } from '@reach/router'
import { css } from '@emotion/core'

const CONTENT_OVERLAP_MAP = {
  SMALL: 25,
  MEDIUM: 150,
  LARGE: 200,
  XLARGE: 400,
  XXLARGE: 600,
}
const GRADIENT_OVERLAP = 150
const GRADIENT_HEIGHT = 250
const INFO_BOTTOM_MARGIN = 100

export const Container = styled.section`
  position: relative;

  // because of the fixed aspect ratio, as the viewport width grows, the media will occupy more height as well
  // so that the media doesn't take too big of a portion of the space, we let the content overlap the media via a negative margin
  @media screen and (min-width: ${breakpoints.small}) {
    margin-bottom: -${CONTENT_OVERLAP_MAP.SMALL}px;
  }
  @media screen and (min-width: ${breakpoints.medium}) {
    margin-bottom: -${CONTENT_OVERLAP_MAP.MEDIUM}px;
  }
  @media screen and (min-width: ${breakpoints.large}) {
    margin-bottom: -${CONTENT_OVERLAP_MAP.LARGE}px;
  }
  @media screen and (min-width: ${breakpoints.xlarge}) {
    margin-bottom: -${CONTENT_OVERLAP_MAP.XLARGE}px;
  }
  @media screen and (min-width: ${breakpoints.xxlarge}) {
    margin-bottom: -${CONTENT_OVERLAP_MAP.XXLARGE}px;
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

export const HorizontalGradientOverlay = styled.div`
  ${absoluteMediaCss};
  display: none;
  background: linear-gradient(90deg, rgba(0, 0, 0, 0.8) 11.76%, rgba(0, 0, 0, 0) 100%);

  @media screen and (min-width: ${breakpoints.small}) {
    display: block;
  }
`

export const VerticalGradientOverlay = styled.div`
  ${absoluteMediaCss};

  // as the content overlaps the media more and more as the viewport width grows, we need to hide some part of the media with a gradient
  // this helps with keeping a consistent background behind a page content - we don't want the media to peek out in the content spacing
  background: linear-gradient(0deg, black 0%, rgba(0, 0, 0, 0) ${GRADIENT_HEIGHT / 2}px);
  @media screen and (min-width: ${breakpoints.small}) {
    background: linear-gradient(
      0deg,
      black 0%,
      black ${CONTENT_OVERLAP_MAP.SMALL - GRADIENT_OVERLAP}px,
      rgba(0, 0, 0, 0) ${CONTENT_OVERLAP_MAP.SMALL - GRADIENT_OVERLAP + GRADIENT_HEIGHT}px
    );
  }
  @media screen and (min-width: ${breakpoints.medium}) {
    background: linear-gradient(
      0deg,
      black 0%,
      black ${CONTENT_OVERLAP_MAP.MEDIUM - GRADIENT_OVERLAP}px,
      rgba(0, 0, 0, 0) ${CONTENT_OVERLAP_MAP.MEDIUM - GRADIENT_OVERLAP + GRADIENT_HEIGHT}px
    );
  }
  @media screen and (min-width: ${breakpoints.large}) {
    background: linear-gradient(
      0deg,
      black 0%,
      black ${CONTENT_OVERLAP_MAP.LARGE - GRADIENT_OVERLAP}px,
      rgba(0, 0, 0, 0) ${CONTENT_OVERLAP_MAP.LARGE - GRADIENT_OVERLAP + GRADIENT_HEIGHT}px
    );
  }
  @media screen and (min-width: ${breakpoints.xlarge}) {
    background: linear-gradient(
      0deg,
      black 0%,
      black ${CONTENT_OVERLAP_MAP.XLARGE - GRADIENT_OVERLAP}px,
      rgba(0, 0, 0, 0) ${CONTENT_OVERLAP_MAP.XLARGE - GRADIENT_OVERLAP + GRADIENT_HEIGHT}px
    );
  }
  @media screen and (min-width: ${breakpoints.xxlarge}) {
    background: linear-gradient(
      0deg,
      black 0%,
      black ${CONTENT_OVERLAP_MAP.XXLARGE - GRADIENT_OVERLAP}px,
      rgba(0, 0, 0, 0) ${CONTENT_OVERLAP_MAP.XXLARGE - GRADIENT_OVERLAP + GRADIENT_HEIGHT}px
    );
  }
`

export const InfoContainer = styled.div`
  position: relative;
  margin-top: -${spacing.xxl};
  padding-bottom: ${spacing.xxxxl};

  @media screen and (min-width: ${breakpoints.small}) {
    position: absolute;
    margin: 0;
    padding: 0;
    bottom: ${CONTENT_OVERLAP_MAP.SMALL + INFO_BOTTOM_MARGIN / 4}px;
    max-width: 400px;
  }

  @media screen and (min-width: ${breakpoints.medium}) {
    bottom: ${CONTENT_OVERLAP_MAP.MEDIUM + INFO_BOTTOM_MARGIN / 2}px;
    max-width: 600px;
  }

  @media screen and (min-width: ${breakpoints.large}) {
    bottom: ${CONTENT_OVERLAP_MAP.LARGE + INFO_BOTTOM_MARGIN}px;
  }

  @media screen and (min-width: ${breakpoints.xlarge}) {
    bottom: ${CONTENT_OVERLAP_MAP.XLARGE + INFO_BOTTOM_MARGIN}px;
  }

  @media screen and (min-width: ${breakpoints.xxlarge}) {
    bottom: ${CONTENT_OVERLAP_MAP.XXLARGE + INFO_BOTTOM_MARGIN}px;
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
    ${fluidRange({ prop: 'fontSize', fromSize: '40px', toSize: '72px' }, '320px', '1920px')};
    ${fluidRange({ prop: 'lineHeight', fromSize: '48px', toSize: '68px' }, '320px', '1920px')};
    font-family: ${typography.fonts.headers};
    font-weight: 700;

    display: inline-block;
    margin: 0 0 ${spacing.m} 0;
    @media screen and (min-width: ${breakpoints.medium}) {
      margin-bottom: ${spacing.l};
    }
  }

  span {
    display: block;
    ${fluidRange({ prop: 'fontSize', fromSize: '14px', toSize: '22px' }, '320px', '1920px')};
    ${fluidRange({ prop: 'lineHeight', fromSize: '20px', toSize: '26px' }, '320px', '1920px')};
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
