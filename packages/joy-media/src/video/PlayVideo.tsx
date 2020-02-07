import React from 'react';
import { Link } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import DPlayer from 'react-dplayer';
import { Table } from 'semantic-ui-react';
import EntityId from '@joystream/types/versioned-store/EntityId';
import { ChannelEntity } from '../entities/ChannelEntity';
import { ChannelPreview } from '../channels/ChannelPreview';
import { VideoPreview } from './VideoPreview';
import { VideoType, VideoClass as Fields, VideoGenericProp } from '../schemas/video/Video';
import { printExplicit, printReleaseDate } from '../entities/EntityHelpers';

const PLAYER_COMMON_PARAMS = {
  lang: 'en',
  autoplay: true,
  theme: '#2185d0'
};

// This is just a part of Player's methods that are used in this component.
// To see all the methods available on APlayer and DPlayer visit the next URLs:
// http://aplayer.js.org/#/home?id=api
// http://dplayer.js.org/#/home?id=api
type PartOfPlayer = {
  pause: () => void,
  destroy: () => void
};

export type PlayVideoProps = {
  id: EntityId
  video?: VideoType,
  channel?: ChannelEntity,
  featuredVideos?: VideoType[],
};

export function PlayVideo (props: PlayVideoProps) {
  const { channel, video, featuredVideos = [] } = props;

  if (!video) {
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
    <h3>Details</h3>
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

  //--------
  // TODO Resolve DPlayer callback to destroy it on component unmount

  // let player: PartOfPlayer = undefined;

  const onPlayerCreated = (_player: PartOfPlayer) => {
    // player = player;
  }

  // componentWillUnmount () {
  //   const { player } = this;
  //   if (player) {
  //     console.log('Destroy the current player');
  //     player.pause();
  //     player.destroy();
  //   }
  // }

  //--------

  // TODO: resolve video asset URL
  const assetUrl = 'http://fake-asset-url.com';

  // TODO Do real check if current use is an owner of this entity:
  const iAmOwner = true;

  return <div className='JoyPlayAlbum'>
    <div className='JoyPlayAlbum_Main'>
      <div className='JoyPlayAlbum_CurrentTrack'>
        <div className='PlayBox'>

          <DPlayer
            {...PLAYER_COMMON_PARAMS}
            video={{
              url: assetUrl,
              name: video.title,
              pic: video.thumbnail
            }}
            loop={false}
            onLoad={onPlayerCreated} // Note that DPlayer has onLoad, but APlayer - onInit.
          />

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
          <VideoPreview key={`VideoPreview${i}`} {...x} size='small' orientation='horizontal' />
        )}
      </div>
    }
  </div>;
}