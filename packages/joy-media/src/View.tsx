import React from 'react';
import { Link } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import axios, { CancelTokenSource } from 'axios';
import DPlayer from 'react-dplayer';
import APlayer from 'react-aplayer';

import { ApiProps } from '@polkadot/react-api/types';
import { I18nProps } from '@polkadot/react-components/types';
import { withCalls, withMulti } from '@polkadot/react-api/with';
import { Option } from '@polkadot/types/codec';
import { formatNumber } from '@polkadot/util';
import { AccountId } from '@polkadot/types/interfaces';

import translate from './translate';
import { DiscoveryProviderProps } from './DiscoveryProvider';
import { DataObject, ContentMetadata, ContentId, DataObjectStorageRelationshipId, DataObjectStorageRelationship } from '@joystream/types/media';
import { MutedDiv } from '@polkadot/joy-utils/MutedText';
import { onImageError, DEFAULT_THUMBNAIL_URL } from './utils';
import { isEmptyStr } from '@polkadot/joy-utils/index';
import { MyAccountContext, MyAccountContextProps } from '@polkadot/joy-utils/MyAccountContext';
import { Message } from 'semantic-ui-react';
import { MemberPreview } from '@polkadot/joy-members/MemberPreview';

import _ from 'lodash';

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

type Asset = {
  iAmOwner: boolean,
  contentId: ContentId,
  data?: DataObject,
  meta: ContentMetadata
};

export function ContentPreview ({ iAmOwner, contentId, data, meta }: Asset) {
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
          <Link className='ui small circular icon inverted primary button' style={{ float: 'right' }} title='Edit' to={`/media/edit/${contentId.encode()}`}>
            <i className='pencil alternate icon'></i>
          </Link>
        }
        <div><h3>{name}</h3></div>
        <MemberPreview accountId={meta.owner} style={{ marginBottom: '.5rem' }} />
        <MutedDiv smaller>{new Date(added_at.time.toNumber()).toLocaleString()}</MutedDiv>
        {data && <MutedDiv smaller>{formatNumber(data.size_in_bytes)} bytes</MutedDiv>}
      </div>
    </Link>
  );
}

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

    const asset: Asset = {
      iAmOwner,
      contentId: this.props.contentId,
      data: dataObjectOpt.unwrapOr(undefined),
      meta
    };

    return preview
      ? ContentPreview(asset)
      : this.renderPlayer(asset);
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

    const { resolvedAssetUrl: url, contentType = 'video/video' } = this.props;
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
        <MemberPreview accountId={meta.owner} style={{ marginBottom: '.5rem' }} />
        <div className='smaller grey text'>Published on {new Date(added_at.time.toNumber()).toLocaleString()}</div>
        {description &&
          <ReactMarkdown className='JoyMemo--full ContentDesc' source={description.toString()} linkTarget='_blank' />
        }
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
  error?: Error,
  cancelSource: CancelTokenSource
};

class InnerPlay extends React.PureComponent<PlayProps, PlayState> {

  state: PlayState = {
    resolvingAsset: false,
    cancelSource: axios.CancelToken.source()
  };

  componentDidMount () {
    this.resolveAsset();
  }

  componentWillUnmount () {
    const { cancelSource } = this.state;
    cancelSource.cancel();
  }

  private resolveAsset = async () => {
    const { discoveryProvider, api } = this.props;
    const { match: { params: { assetName } } } = this.props;
    const contentId = ContentId.decode(assetName);

    if (!contentId) {
      this.setState({
        error: new Error('Invalid content id')
      });
      return;
    }

    this.setState({ resolvingAsset: true, contentId, error: undefined });

    const rids: DataObjectStorageRelationshipId[] = await api.query.dataObjectStorageRegistry.relationshipsByContentId(contentId) as any;

    const allRelationships: Option<DataObjectStorageRelationship>[] = await Promise.all(rids.map((id) => api.query.dataObjectStorageRegistry.relationships(id))) as any;

    let readyProviders = allRelationships.filter(r => r.isSome).map(r => r.unwrap())
        .filter(r => r.ready)
        .map(r => r.storage_provider);

    // runtime doesn't currently guarantee unique set
    readyProviders = _.uniqBy(readyProviders, provider => provider.toString());

    if (!readyProviders.length) {
      this.setState({
        resolvingAsset: false,
        error: new Error('No Storage Providers found storing this content')
      });
      return;
    }

    // filter out providers no longer in actors list
    const stakedActors = await api.query.actors.actorAccountIds() as unknown as AccountId[];

    readyProviders = _.intersectionBy(stakedActors, readyProviders, provider => provider.toString());
    console.log(`found ${readyProviders.length} providers ready to serve content: ${readyProviders}`);

    // shuffle to spread the load
    readyProviders = _.shuffle(readyProviders);

    // TODO: prioritize already resolved providers, least reported unreachable, closest
    // by geography etc..

    const { cancelSource } = this.state;

    // loop over providers until we find one that responds
    while (readyProviders.length) {
      const provider = readyProviders.shift();
      if (!provider) continue;

      const { resolvingAsset } = this.state;
      if (!resolvingAsset) {
        break;
      }

      try {
        var resolvedAssetUrl = await discoveryProvider.resolveAssetEndpoint(provider, contentId.encode(), cancelSource.token);
      } catch (err) {
        if (axios.isCancel(err)) {
          return;
        } else {
          continue;
        }
      }

      try {
        console.log('trying', resolvedAssetUrl);
        let response = await axios.head(resolvedAssetUrl, { cancelToken: cancelSource.token });
        const contentType = response.headers['content-type'] || 'video/video';
        this.setState({ contentType, resolvedAssetUrl, resolvingAsset: false });
        return;
      } catch (err) {
        if (axios.isCancel(err)) {
          return;
        } else {
          if (!err.response || (err.response.status >= 500 && err.response.status <= 504)) {
            // network connection error
            discoveryProvider.reportUnreachable(provider);
          }
          // try next provider
          continue;
        }
      }
    }

    this.setState({
      resolvingAsset: false,
      error: new Error('Unable to reach any provider serving this content')
    });
  }

  render () {
    const { error, resolvedAssetUrl, contentType, contentId } = this.state;

    if (error) {
      return (
        <Message error className='JoyMainStatus'>
          <Message.Header>Error Loading Content</Message.Header>
          <p>{error.toString()}</p>
          <button className='ui button' onClick={this.resolveAsset}>Try again</button>
        </Message>
      );
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
  translate
);
