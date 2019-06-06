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
import { withDiscoveryProvider, DiscoveryProviderProps } from './DiscoveryProvider';
import { DataObject, ContentMetadata, ContentId, DataObjectStorageRelationshipId, DataObjectStorageRelationship } from '@joystream/types/media';
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

type ViewProps = ApiProps & I18nProps & DiscoveryProviderProps & {
  contentId: ContentId,
  contentType?: string,
  dataObjectOpt?: Option<DataObject>,
  metadataOpt?: Option<ContentMetadata>,
  preview?: boolean,
  resolvedAssetUrl?: string,
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

    const {resolvedAssetUrl: url} = this.props;

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
  withCalls<ViewProps>(
    ['query.dataDirectory.dataObjectByContentId',
      { paramName: 'contentId', propName: 'dataObjectOpt' } ],
    ['query.dataDirectory.metadataByContentId',
      { paramName: 'contentId', propName: 'metadataOpt' } ]
  )
);

type PlayProps = ApiProps & I18nProps & DiscoveryProviderProps & {
  match: {
    params: {
      assetName: string
    }
  }
};

type PlayState = {
  contentId?: ContentId,
  contentType?: string,
  resolvingAsset: boolean,
  resolvedAssetUrl?: string,
  error?: Error
};

class InnerPlay extends React.PureComponent<PlayProps, PlayState> {

  state: PlayState = {
    resolvingAsset: false
  };

  componentDidMount() {
    this.resolveAsset();
  }

  componentWillUnmount() {
    // cancel axios requests
    // https://stackoverflow.com/questions/38329209/how-to-cancel-abort-ajax-request-in-axios
  }

  async resolveAsset () {
    const { discoveryProvider, api } = this.props;
    const { match: { params: { assetName } } } = this.props;
    const contentId = ContentId.fromAddress(assetName);

    if (!contentId) {
      this.setState({
        error: new Error('Invalid content id')
      });
      return;
    }

    this.setState({ resolvingAsset: true, contentId });

    const rids: DataObjectStorageRelationshipId[] = await api.query.dataObjectStorageRegistry.relationshipsByContentId(contentId) as any;

    const allRelationships: Option<DataObjectStorageRelationship>[] = await Promise.all(rids.map((id) => api.query.dataObjectStorageRegistry.relationships(id))) as any;

    let readyProviders = allRelationships.filter(r => r.isSome).map(r => r.unwrap())
        .filter(r => r.ready)
        .map(r => r.storage_provider);

    if (!readyProviders.length) {
      this.setState({resolvingAsset: false, error: new Error('No Storage Providers found')});
      return
    }

    // shuffle then loop over providers until we find one that responds
    // TODO: readyProviders = readyProviders.shuffle()
    for(let provider; provider = readyProviders.pop();) {
      const resolvedAssetUrl = await discoveryProvider.resolveAssetEndpoint(provider, contentId.toAddress())

      try {
        let response = await axios.head(resolvedAssetUrl)
        const contentType = response.headers['content-type'] || 'video/video';
        this.setState({ contentType, resolvedAssetUrl, resolvingAsset: false });
        return
      } catch (err) {
        // try next provider
      }
    }

    this.setState({resolvingAsset: false, error: new Error('Unable to contact a Storage Providers')});
  }

  render () {
    const { error, resolvedAssetUrl, contentType, contentId } = this.state;

    if (error) {
      return <em>Error loading content: {error.message}</em>;
    }

    if (resolvedAssetUrl) {
      return <View contentType={contentType} resolvedAssetUrl={resolvedAssetUrl} contentId={contentId}/>;
    } else {
      return <em>Loading...</em>;
    }
  }
}

export const Play = withMulti(
  InnerPlay,
  translate,
  withDiscoveryProvider
);
