import React from 'react';
import ReactMarkdown from 'react-markdown';
import { Table } from 'semantic-ui-react';
import { ApiProps } from '@polkadot/react-api/types';
import { ApiConsumer } from '@polkadot/react-api/ApiContext';
import EntityId from '@joystream/types/versioned-store/EntityId';
import { ChannelEntity } from '../entities/ChannelEntity';
import { ChannelPreview } from '../channels/ChannelPreview';
import { VideoPreview } from './VideoPreview';
import { VideoType, VideoClass as Fields, VideoGenericProp } from '../schemas/video/Video';
import { printExplicit, printReleaseDate, printLanguage } from '../entities/EntityHelpers';
import { MediaObjectType } from '../schemas/general/MediaObject';
import { MediaPlayerWithResolver } from '../common/MediaPlayerWithResolver';
import { ContentId } from '@joystream/types/media';

export type PlayVideoProps = {
  channel?: ChannelEntity
  mediaObject?: MediaObjectType
  id: EntityId
  video?: VideoType
  moreChannelVideos?: VideoType[]
  featuredVideos?: VideoType[]
}

type ListOfVideoPreviewProps = {
  videos?: VideoType[]
}

function VertialListOfVideoPreviews(props: ListOfVideoPreviewProps) {
  const { videos = [] } = props
  return <>{videos.map((video) =>
    <VideoPreview key={`VideoPreview-${video.id}`} {...video} size='small' orientation='horizontal' withChannel />
  )}</>
}

export function PlayVideo (props: PlayVideoProps) {
  const { channel, mediaObject, video, moreChannelVideos = [], featuredVideos = [] } = props;

  if (!mediaObject || !video) {
    return <em>Video was not found</em>
  }

  if (!channel) {
    return <em>Channel was not found</em>
  }

  const metaField = (field: VideoGenericProp, value: React.ReactNode | string) => (
    typeof video[field.id] !== 'undefined' &&
      <Table.Row>
        <Table.Cell width={4}>{field.name}</Table.Cell>
        <Table.Cell>{value}</Table.Cell>
      </Table.Row>
  )

  const printLinks = (links?: string[]) => {
    return (links || []).map((x, i) =>
      <div key={`EntityLink-${i}`}>
        <a href={encodeURI(x)} target='_blank' rel='nofollow'>{x}</a>
      </div>
    )
  }

  const metaTable = <>
    <h3>Video details</h3>
    <Table basic='very' compact className='JoyPlayAlbum_MetaInfo'>
      <Table.Body>
        {metaField(Fields.explicit, printExplicit(video.explicit))}
        {metaField(Fields.firstReleased, printReleaseDate(video.firstReleased))}
        {metaField(Fields.language, printLanguage(video.language))}
        {metaField(Fields.category, video.category?.value)}
        {metaField(Fields.license, video.license?.value)}
        {metaField(Fields.attribution, video.attribution)}
        {metaField(Fields.link, printLinks(video.link))}
        {metaField(Fields.curationStatus, video.curationStatus?.value)}
      </Table.Body>
    </Table>
  </>

  // TODO show video only to its owner, if the video is not public.
  // see isPublicVideo() function.

  const contentId = ContentId.decode(mediaObject.value)

  // console.log('PlayVideo: props', props)

  return <div className='JoyPlayAlbum'>
    <div className='JoyPlayAlbum_Main'>
      <div className='JoyPlayAlbum_CurrentTrack'>
        <div className='PlayBox'>

          <ApiConsumer>
            {(apiProps?: ApiProps): React.ReactNode => 
              <MediaPlayerWithResolver {...props} contentId={contentId} api={apiProps?.api} />
            }
          </ApiConsumer>

          <ChannelPreview channel={channel} />

          {video.description &&
            <ReactMarkdown
              className='JoyMemo--full ContentDesc'
              source={video.description}
              linkTarget='_blank'
            />
          }
        </div>
        <div className='PlayVideoDetails'>
          {metaTable}
        </div>
      </div>
    </div>

    <div className='JoyPlayAlbum_RightSidePanel'>
      {featuredVideos.length > 0 &&
        <div>
          <h3 style={{ marginBottom: '1rem' }}>Featured videos</h3>
          <VertialListOfVideoPreviews videos={featuredVideos} />
        </div>
      }
      {moreChannelVideos.length > 0 &&
        <div style={{ marginTop: '1rem' }}>
          <h3 style={{ marginBottom: '1rem' }}>More from this channel</h3>
          <VertialListOfVideoPreviews videos={moreChannelVideos} />
        </div>
      }
    </div>
  </div>;
}