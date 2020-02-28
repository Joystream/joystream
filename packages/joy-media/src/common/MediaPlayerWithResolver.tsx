import React from 'react';
import axios, { CancelTokenSource } from 'axios';
import _ from 'lodash';

import { ApiProps } from '@polkadot/react-api/types';
import { I18nProps } from '@polkadot/react-components/types';
import { withMulti } from '@polkadot/react-api/with';
import { Option } from '@polkadot/types/codec';
import { AccountId } from '@polkadot/types/interfaces';

import translate from '../translate';
import { DiscoveryProviderProps } from '../DiscoveryProvider';
import { DataObjectStorageRelationshipId, DataObjectStorageRelationship } from '@joystream/types/media';
import { Message } from 'semantic-ui-react';
import { MediaPlayerView, RequiredMediaPlayerProps } from './MediaPlayerView';

type Props = ApiProps & I18nProps & DiscoveryProviderProps & RequiredMediaPlayerProps;

type State = {
  contentType?: string,
  resolvingAsset: boolean,
  resolvedAssetUrl?: string,
  error?: Error,
  cancelSource: CancelTokenSource
};

class InnerComponent extends React.PureComponent<Props, State> {

  state: State = {
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
    const { contentId, discoveryProvider, api } = this.props;

    this.setState({ resolvingAsset: true, error: undefined });

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
    console.log(`Found ${readyProviders.length} providers ready to serve content: ${readyProviders}`);

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
    const { error, contentType, resolvedAssetUrl } = this.state;

    console.log({ resolvedAssetUrl })

    if (error) {
      return (
        <Message error className='JoyMainStatus'>
          <Message.Header>Error loading media content</Message.Header>
          <p>{error.toString()}</p>
          <button className='ui button' onClick={this.resolveAsset}>Try again</button>
        </Message>
      );
    }

    if (resolvedAssetUrl) {
      const playerProps = { ...this.props, contentType, resolvedAssetUrl }
      return <MediaPlayerView {...playerProps} />;
    } else {
      return <em>Resolving media content...</em>;
    }
  }
}

export const MediaPlayerWithResolver = withMulti(
  InnerComponent,
  translate
)
