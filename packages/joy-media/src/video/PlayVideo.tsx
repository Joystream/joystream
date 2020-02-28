import React from 'react';
import { Link } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import { Table } from 'semantic-ui-react';
import { ApiProps } from '@polkadot/react-api/types';
import { ApiConsumer } from '@polkadot/react-api/ApiContext';
import EntityId from '@joystream/types/versioned-store/EntityId';
import { ChannelEntity } from '../entities/ChannelEntity';
import { ChannelPreview } from '../channels/ChannelPreview';
import { VideoPreview } from './VideoPreview';
import { VideoType, VideoClass as Fields, VideoGenericProp } from '../schemas/video/Video';
import { printExplicit, printReleaseDate } from '../entities/EntityHelpers';
import { MediaObjectType } from '../schemas/general/MediaObject';
import { MediaPlayerWithResolver } from '../common/MediaPlayerWithResolver';
import { ContentId } from '@joystream/types/media';

export type PlayVideoProps = {
  mediaObject?: MediaObjectType
  id: EntityId
  video?: VideoType
  channel?: ChannelEntity
  featuredVideos?: VideoType[]
};

export function PlayVideo (props: PlayVideoProps) {
  const { mediaObject, video, channel, featuredVideos = [] } = props;

  if (!mediaObject || !video) {
    return <em>Video was not found</em>
  }

  if (!channel) {
    return <em>Channel was not found</em>
  }

  const metaField = (field: VideoGenericProp, value: React.ReactNode | string) =>
    <Table.Row>
      <Table.Cell width={4}>{field.name}</Table.Cell>
      <Table.Cell>{value}</Table.Cell>
    </Table.Row>

  const metaTable = <>
    <h3>Video details</h3>
    <Table basic='very' compact className='JoyPlayAlbum_MetaInfo'>
      <Table.Body>
        {metaField(Fields.firstReleased, printReleaseDate(video.firstReleased))}
        {metaField(Fields.explicit, printExplicit(video.explicit))}

        {/* TODO show other resolved internal values: language, category, etc. */}

      </Table.Body>
    </Table>
  </>

  // TODO show video only to its owner, if the video is not public.
  // see isPublicVideo() function.

  // TODO: resolve video asset URL !!!
  const assetUrl = 'http://fake-asset-url.com';

  // TODO Do real check if current use is an owner of this entity:
  const iAmOwner = true;

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

          <div className='ContentHeader'>

            <a className='ui button outline DownloadBtn' href={`${assetUrl}?download`}><i className='cloud download icon'></i> Download</a>
            {iAmOwner &&
              <Link to={`/media/video/${video.id}/edit`} className='ui button' style={{ float: 'right' }}>
                <i className='pencil alternate icon'></i>
                Edit
              </Link>
            }
            <h1>{video.title}</h1>
          </div>

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

    {featuredVideos.length > 0 &&
      <div className='JoyPlayAlbum_Featured'>
        <h3 style={{ marginBottom: '1rem' }}>Featured videos</h3>
        {featuredVideos.map((x, i) =>
          <VideoPreview key={`VideoPreview-${x.id}`} {...x} size='small' orientation='horizontal' />
        )}
      </div>
    }
  </div>;
}