import React from 'react';
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
import { MyAccountContext } from '@polkadot/joy-utils/MyAccountContext';
import { VideoType } from '../schemas/video/Video';
import { ChannelType } from '../schemas/channel/Channel';

const PLAYER_COMMON_PARAMS = {
  lang: 'en',
  autoplay: true,
  theme: '#2185d0'
};

// This is just a part of Player's methods that are used in this component.
// To see all the methods available on APlayer and DPlayer visit the next URLs:
// http://aplayer.js.org/#/home?id=api
// http://dplayer.js.org/#/home?id=api
interface PartOfPlayer {
  pause: () => void
  destroy: () => void
}

export type RequiredMediaPlayerProps = {
  channel: ChannelType
  video: VideoType
  contentId: ContentId
}

type Props = ApiProps & I18nProps & DiscoveryProviderProps & RequiredMediaPlayerProps & {
  contentType?: string
  dataObjectOpt?: Option<DataObject>
  resolvedAssetUrl?: string
};

class InnerComponent extends React.PureComponent<Props> {

  static contextType = MyAccountContext;

  private player?: PartOfPlayer = undefined;

  private onPlayerCreated = (player: PartOfPlayer) => {
    this.player = player;
  }

  componentWillUnmount () {
    const { player } = this;
    if (player) {
      console.log('Destroy the current player');
      player.pause();
      player.destroy();
    }
  }

  render () {
    const { dataObjectOpt } = this.props;
    if (!dataObjectOpt || dataObjectOpt.isNone ) {
      return null;
    }

    // TODO extract and show the next info from dataObject:
    // {"owner":"5GSMNn8Sy8k64mGUWPDafjMZu9bQNX26GujbBQ1LeJpNbrfg","added_at":{"block":2781,"time":1582750854000},"type_id":1,"size":3664485,"liaison":"5HN528fspu4Jg3KXWm7Pu7aUK64RSBz2ZSbwo1XKR9iz3hdY","liaison_judgement":1,"ipfs_content_id":"QmNk4QczoJyPTAKdfoQna6KhAz3FwfjpKyRBXAZHG5djYZ"}

    const { video, resolvedAssetUrl: url, contentType = 'video/video' } = this.props;
    const { thumbnail: cover } = video;
    const prefix = contentType.substring(0, contentType.indexOf('/'));

    // const myAccountCtx = this.context as MyAccountContextProps;
    // const myAddress = myAccountCtx.state.address;

    // TODO update to entity aproach and fix this:
    // const iAmOwner: boolean = myAddress !== undefined && myAddress === channel.owner.toString();
    const iAmOwner = false

    const renderPlayer = () => {
      if (prefix === 'video') {
        const video = { url, name, pic: cover };
        return <DPlayer
          video={video}
          {...PLAYER_COMMON_PARAMS}
          loop={false}
          onLoad={this.onPlayerCreated} // Note that DPlayer has onLoad, but APlayer - onInit.
        />;
      } else if (prefix === 'audio') {
        const audio = { url, name, cover };
        return <APlayer
          audio={audio}
          {...PLAYER_COMMON_PARAMS}
          loop='none'
          onInit={this.onPlayerCreated} // Note that APlayer has onInit, but DPlayer - onLoad.
        />;
      } else {
        return <em>Unsupported type of content: {contentType}</em>;
      }
    };

    return (
      <div className='PlayBox'>
        {renderPlayer()}
        <div className='ContentHeader'>
          <a className='ui button outline DownloadBtn' href={`${url}?download`}><i className='cloud download icon'></i> Download</a>

          {iAmOwner &&
            <Link className='ui button' style={{ float: 'right' }} to={`/media/video/${video.id}/edit`}>
              <i className='pencil alternate icon'></i>
              Edit
            </Link>
          }

          <h1>{video.title}</h1>
        </div>
      </div>
    );
  }
}

export const MediaPlayerView = withMulti(
  InnerComponent,
  translate,
  withCalls<Props>(
    ['query.dataDirectory.dataObjectByContentId',
      { paramName: 'contentId', propName: 'dataObjectOpt' } ]
  )
)
