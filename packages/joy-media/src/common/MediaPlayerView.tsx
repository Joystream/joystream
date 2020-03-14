import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import DPlayer from 'react-dplayer';
import APlayer from 'react-aplayer';

import { ApiProps } from '@polkadot/react-api/types';
import { I18nProps } from '@polkadot/react-components/types';
import { withCalls, withMulti } from '@polkadot/react-api/with';
import { Option } from '@polkadot/types/codec';

import translate from '../translate';
import { DiscoveryProviderProps } from '../DiscoveryProvider';
import { DataObject, ContentId } from '@joystream/types/media';
import { VideoType } from '../schemas/video/Video';
import { isAccountAChannelOwner } from '../channels/ChannelHelpers';
import { ChannelEntity } from '../entities/ChannelEntity';
import { useMyMembership } from '@polkadot/joy-utils/MyMembershipContext';

const PLAYER_COMMON_PARAMS = {
  lang: 'en',
  autoplay: true,
  theme: '#2185d0'
}

// This is just a part of Player's methods that are used in this component.
// To see all the methods available on APlayer and DPlayer visit the next URLs:
// http://aplayer.js.org/#/home?id=api
// http://dplayer.js.org/#/home?id=api
interface PartOfPlayer {
  pause: () => void
  destroy: () => void
}

export type RequiredMediaPlayerProps = {
  channel: ChannelEntity
  video: VideoType
  contentId: ContentId
}

type ContentProps = {
  contentType?: string
  dataObjectOpt?: Option<DataObject>
  resolvedAssetUrl?: string
}

type MediaPlayerViewProps = ApiProps & I18nProps &
  DiscoveryProviderProps & RequiredMediaPlayerProps & ContentProps

type PlayerProps = RequiredMediaPlayerProps & ContentProps

function Player(props: PlayerProps) {
  const { video, resolvedAssetUrl: url, contentType = 'video/video' } = props
  const { thumbnail: cover } = video
  const prefix = contentType.substring(0, contentType.indexOf('/'))

  const [ player, setPlayer ] = useState<PartOfPlayer>()

  const onPlayerCreated = (newPlayer: PartOfPlayer) => {
    console.log('onPlayerCreated:', newPlayer)
    setPlayer(newPlayer)
  }

  const destroyPlayer = () => {
    if (!player) return;

    console.log('Destroy the current player');
    player.pause();
    player.destroy();
    setPlayer(undefined)
  }

  useEffect(() => {
    return () => {
      destroyPlayer()
    }
  }, [ url ])

  if (prefix === 'video') {
    const video = { url, name, pic: cover };
    return <DPlayer
      video={video}
      {...PLAYER_COMMON_PARAMS}
      loop={false}
      onLoad={onPlayerCreated} // Note that DPlayer has onLoad, but APlayer - onInit.
    />;
  } else if (prefix === 'audio') {
    const audio = { url, name, cover };
    return <APlayer
      audio={audio}
      {...PLAYER_COMMON_PARAMS}
      loop='none'
      onInit={onPlayerCreated} // Note that APlayer has onInit, but DPlayer - onLoad.
    />;
  }

  return <em>Unsupported type of content: {contentType}</em>;
}

function InnerComponent(props: MediaPlayerViewProps) {
  const { video, resolvedAssetUrl: url } = props
  
  const { dataObjectOpt, channel } = props;
  if (!dataObjectOpt || dataObjectOpt.isNone ) {
    return null;
  }

  // TODO extract and show the next info from dataObject:
  // {"owner":"5GSMNn8Sy8k64mGUWPDafjMZu9bQNX26GujbBQ1LeJpNbrfg","added_at":{"block":2781,"time":1582750854000},"type_id":1,"size":3664485,"liaison":"5HN528fspu4Jg3KXWm7Pu7aUK64RSBz2ZSbwo1XKR9iz3hdY","liaison_judgement":1,"ipfs_content_id":"QmNk4QczoJyPTAKdfoQna6KhAz3FwfjpKyRBXAZHG5djYZ"}

  const { myAccountId } = useMyMembership()
  const iAmOwner = isAccountAChannelOwner(channel, myAccountId)

  return (
    <div className='PlayBox'>
      
      {/* Note that here we use a 'key' prop to force Player component to rerender */}
      <Player {...props} key={url} />

      <div className='ContentHeader'>
        <a className='ui button outline DownloadBtn' href={`${url}?download`}><i className='cloud download icon'></i> Download</a>

        {iAmOwner &&
          <Link to={`/media/videos/${video.id}/edit`} className='ui button' style={{ float: 'right' }}>
            <i className='pencil alternate icon'></i>
            Edit
          </Link>
        }

        <h1>{video.title}</h1>
      </div>
    </div>
  );
}

export const MediaPlayerView = withMulti(
  InnerComponent,
  translate,
  withCalls<MediaPlayerViewProps>(
    ['query.dataDirectory.dataObjectByContentId',
      { paramName: 'contentId', propName: 'dataObjectOpt' } ]
  )
)
