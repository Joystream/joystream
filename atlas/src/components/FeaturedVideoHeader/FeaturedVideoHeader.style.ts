import styled from '@emotion/styled'
import { fluidRange } from 'polished'

import { Avatar, Button } from '@/shared/components'
import { breakpoints, colors, spacing, typography } from '@/shared/theme'
import { Link } from '@reach/router'

export const Container = styled.section`
  position: relative;
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

export const BackgroundImage = styled.div<{ src: string }>`
  width: 100%;
  height: 0;
  padding-top: 56.25%;
  background-repeat: no-repeat;
  background-position: center;
  background-attachment: local;
  background-size: cover;

  background-image: linear-gradient(0deg, black 0%, rgba(0, 0, 0, 0) 20%), url(${({ src }) => src});
  @media screen and (min-width: ${breakpoints.small}) {
    background-image: linear-gradient(0deg, black 0%, rgba(0, 0, 0, 0) 50%), url(${({ src }) => src});
  }
  @media screen and (min-width: ${breakpoints.medium}) {
    background-image: linear-gradient(0deg, black 0%, rgba(0, 0, 0, 0) 70%), url(${({ src }) => src});
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

export const PlayButton = styled(Button)`
  width: 116px;
`
