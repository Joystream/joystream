import React from 'react';
import { Link } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import axios from 'axios';
import DPlayer from 'react-dplayer';
import APlayer from 'react-aplayer';

import { ApiProps } from '@polkadot/ui-api/types';
import { I18nProps } from '@polkadot/ui-app/types';
import { withCalls, withMulti } from '@polkadot/ui-api/with';
import { Option } from '@polkadot/types/codec';
import { formatNumber } from '@polkadot/util';

import translate from './translate';
import { withStorageProvider, StorageProviderProps } from './StorageProvider';
import { DataObject, ContentMetadata, ContentId } from './types';
import { MutedText } from '@polkadot/joy-utils/MutedText';
import { DEFAULT_THUMBNAIL_URL, onImageError } from './utils';
import { isEmptyStr } from '@polkadot/joy-utils/';
import { MyAccountContext, MyAccountContextProps } from '@polkadot/joy-utils/MyAccountContext';

type Asset = {
  iAmOwner: boolean,
  contentId: string,
  data: DataObject,
  meta: ContentMetadata
};

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

type ViewProps = ApiProps & I18nProps & StorageProviderProps & {
  contentId: ContentId,
  contentType?: string,
  dataObjectOpt?: Option<DataObject>,
  metadataOpt?: Option<ContentMetadata>,
  preview?: boolean
};

class InnerView extends React.PureComponent<ViewProps> {

  static contextType = MyAccountContext;

  render () {
    const { dataObjectOpt, metadataOpt, preview = false } = this.props;
    if (!dataObjectOpt || !metadataOpt
      || dataObjectOpt.isNone || metadataOpt.isNone) {
      return null;
    }

    const myAccountCtx = this.context as MyAccountContextProps;
    const myAddress = myAccountCtx.state.address;

    const meta = metadataOpt.unwrap();
    const iAmOwner: boolean = myAddress !== undefined && myAddress === meta.owner.toString();

    const asset = {
      iAmOwner,
      contentId: this.props.contentId.toAddress(),
      data: dataObjectOpt.unwrap(),
      meta
    };

    return preview
      ? this.renderPreview(asset)
      : this.renderPlayer(asset);
  }

  private renderPreview ({ iAmOwner, contentId, data, meta }: Asset) {
    const { added_at } = meta;
    let { name, thumbnail } = meta.parseJson();

    if (isEmptyStr(thumbnail)) {
      thumbnail = DEFAULT_THUMBNAIL_URL;
    }

    return (
      <Link className={`MediaCell ${iAmOwner ? 'MyContent' : ''}`} to={`/media/play/${contentId}`}>
        <div className='CellContent'>
          <div className='ThumbBox'>
            <img className='ThumbImg' src={thumbnail} onError={onImageError} />
          </div>
          {iAmOwner &&
            <Link className='ui small circular icon inverted primary button' style={{ float: 'right' }} title='Edit' to={`/media/edit/${contentId}`}>
              <i className='pencil alternate icon'></i>
            </Link>
          }
          <div><h3>{name}</h3></div>
          <MutedText smaller>{new Date(added_at.time).toLocaleString()}</MutedText>
          <MutedText smaller>{formatNumber(data.size_in_bytes)} bytes</MutedText>
        </div>
      </Link>
    );
  }

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

  private renderPlayer ({ iAmOwner, contentId, meta }: Asset) {
    const { added_at } = meta;
    const { name, description, thumbnail: cover } = meta.parseJson();

    const { storageProvider } = this.props;
    const url = storageProvider.buildApiUrl(contentId);

    const { contentType = 'video/video' } = this.props;
    const prefix = contentType.substring(0, contentType.indexOf('/'));

    const content = () => {
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
        {content()}
        <div className='ContentHeader'>
          <a className='ui button outline DownloadBtn' href={`${url}?download`}><i className='cloud download icon'></i> Download</a>
          {iAmOwner &&
            <Link className='ui button' style={{ float: 'right' }} to={`/media/edit/${contentId}`}>
              <i className='pencil alternate icon'></i>
              Edit
            </Link>
          }
          <h1>{name}</h1>
        </div>
        <div className='smaller grey text'>Published on {new Date(added_at.time).toLocaleString()}</div>
        { description && <ReactMarkdown className='JoyMemo--full ContentDesc' source={description.toString()} linkTarget='_blank' />}
      </div>
    );
  }
}

export const View = withMulti(
  InnerView,
  translate,
  withStorageProvider,
  withCalls<ViewProps>(
    ['query.dataDirectory.dataObjectByContentId',
      { paramName: 'contentId', propName: 'dataObjectOpt' } ],
    ['query.dataDirectory.metadataByContentId',
      { paramName: 'contentId', propName: 'metadataOpt' } ]
  )
);

type PlayProps = ApiProps & I18nProps & StorageProviderProps & {
  match: {
    params: {
      assetName: string
    }
  }
};

type PlayState = {
  contentType?: string,
  contentTypeRequested: boolean
};

class InnerPlay extends React.PureComponent<PlayProps, PlayState> {

  state: PlayState = {
    contentTypeRequested: false
  };

  requestContentType (contentId: string) {
    console.log('Request content type...');

    const { storageProvider } = this.props;
    const url = storageProvider.buildApiUrl(contentId);
    this.setState({ contentTypeRequested: true });

    axios
      .head(url)
      .then(response => {
        const contentType = response.headers['content-type'] || 'video/video';
        this.setState({ contentType });
      });
  }

  render () {
    const { match: { params: { assetName } } } = this.props;
    try {
      const contentId = ContentId.fromAddress(assetName);
      const { contentType, contentTypeRequested } = this.state;
      if (typeof contentType === 'string') {
        return <View contentId={contentId} contentType={contentType} />;
      } else if (!contentTypeRequested) {
        this.requestContentType(assetName);
      }
      return <em>Loading...</em>;
    } catch (err) {
      console.log('Invalid content ID:', assetName);
    }
    return <em>Content was not found by ID: {assetName}</em>;
  }
}

export const Play = withMulti(
  InnerPlay,
  translate,
  withStorageProvider
);
