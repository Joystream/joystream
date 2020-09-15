import styled from '@emotion/styled'
import { ChannelAvatar, VideoPreview } from '@/shared/components'
import theme from '@/shared/theme'

export const Container = styled.div`
  display: flex;
  flex-direction: column;
  // TODO: remove once we have the navbar
  padding-top: 72px;
`

export const PlayerContainer = styled.div`
  display: flex;
  justify-content: center;
`

export const InfoContainer = styled.div`
  padding: ${theme.spacing.xxl};
`

export const TitleActionsContainer = styled.div`
  display: flex;
  justify-content: space-between;
`

export const Title = styled.h2`
  font-size: ${theme.typography.sizes.h2};
  margin: 0;
`

export const ActionsContainer = styled.div``

export const Meta = styled.span`
  display: block;
  margin-top: ${theme.spacing.xxs};
  color: ${theme.colors.gray[300]};
`

export const StyledChannelAvatar = styled(ChannelAvatar)`
  margin-top: ${theme.spacing.m};
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
