import styled from '@emotion/styled'
import { ChannelAvatar, Placeholder } from '@/shared/components'
import theme from '@/shared/theme'

export const Container = styled.div`
  display: flex;
  flex-direction: column;
`

export const PlayerContainer = styled.div`
  width: min(1250px, 100%);
`

export const PlayerWrapper = styled.div`
  display: flex;
  justify-content: center;
`

export const PlayerPlaceholder = styled(Placeholder)`
  padding-top: 56.25%;
  height: 0;
`

export const DescriptionPlaceholder = styled(Placeholder)`
  height: 28px;
  margin: ${theme.spacing.m} 0 0;
`

export const InfoContainer = styled.div`
  padding: ${theme.spacing.xxl} 0;
`

export const Title = styled.h2`
  font-size: ${theme.typography.sizes.h2};
  margin: 0;
`

export const Meta = styled.span`
  display: block;
  margin-top: ${theme.spacing.xxs};
  color: ${theme.colors.gray[300]};
`

export const ChannelContainer = styled.div`
  margin-top: ${theme.spacing.m};
`

export const StyledChannelAvatar = styled(ChannelAvatar)`
  :hover {
    cursor: pointer;
  }
`

export const DescriptionContainer = styled.div`
  margin-top: ${theme.spacing.xl};
  border-top: 1px solid ${theme.colors.gray[800]};

  p {
    color: ${theme.colors.gray[300]};
    line-height: 175%;
    margin: ${theme.spacing.m} 0 0;
  }
`

export const MoreVideosContainer = styled.div`
  margin-top: 88px;
`

export const MoreVideosHeader = styled.h5`
  margin: 0 0 ${theme.spacing.m};
  font-size: ${theme.typography.sizes.h5};
`
