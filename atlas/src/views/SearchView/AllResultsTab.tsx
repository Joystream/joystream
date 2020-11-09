import React from 'react'
import { Search_search_item_Channel, Search_search_item_Video } from '@/api/queries/__generated__/Search'
import { Placeholder, VideoPreviewBase } from '@/shared/components'
import styled from '@emotion/styled'
import { spacing, typography } from '@/shared/theme'
import { VideoPreview, ChannelGallery, VideoGallery } from '@/components'

type AllResultsTabProps = {
  videos: Search_search_item_Video[]
  channels: Search_search_item_Channel[]
  loading: boolean
}

const AllResultsTab: React.FC<AllResultsTabProps> = ({ videos: allVideos, channels, loading }) => {
  const [bestMatch, ...videos] = allVideos

  return (
    <>
      <div>
        {loading && (
          <>
            <Placeholder width={200} height={16} bottomSpace={18} />
            <VideoPreviewBase main />
          </>
        )}
        {bestMatch && (
          <>
            <h3>Best Match</h3>
            <VideoPreview
              id={bestMatch.id}
              channelId={bestMatch.channel.id}
              title={bestMatch.title}
              duration={bestMatch.duration}
              channelName={bestMatch.channel.handle}
              createdAt={bestMatch.publishedOnJoystreamAt}
              views={bestMatch.views}
              posterURL={bestMatch.thumbnailURL}
              main
            />
          </>
        )}
      </div>
      {(videos.length > 0 || loading) && (
        <div>
          {loading ? <Placeholder width={200} height={16} bottomSpace={18} /> : <SectionHeader>Videos</SectionHeader>}
          <VideoGallery videos={videos} loading={loading} />
        </div>
      )}
      {(channels.length > 0 || loading) && (
        <div>
          {loading ? <Placeholder width={200} height={16} bottomSpace={18} /> : <SectionHeader>Channels</SectionHeader>}
          <ChannelGallery channels={channels} loading={loading} />
        </div>
      )}
    </>
  )
}

const SectionHeader = styled.h5`
  margin: 0 0 ${spacing.m};
  font-size: ${typography.sizes.h5};
`

export default AllResultsTab
