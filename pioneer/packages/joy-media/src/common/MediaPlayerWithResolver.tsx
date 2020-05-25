import React, { useState, useEffect } from 'react';
import axios, { CancelTokenSource } from 'axios';
import _ from 'lodash';

import { ApiProps } from '@polkadot/react-api/types';
import { I18nProps } from '@polkadot/react-components/types';
import { withMulti } from '@polkadot/react-api/with';
import { Option } from '@polkadot/types/codec';
import { AccountId } from '@polkadot/types/interfaces';

import translate from '../translate';
import { DiscoveryProviderProps, withDiscoveryProvider } from '../DiscoveryProvider';
import { DataObjectStorageRelationshipId, DataObjectStorageRelationship } from '@joystream/types/media';
import { Message } from 'semantic-ui-react';
import { MediaPlayerView, RequiredMediaPlayerProps } from './MediaPlayerView';
import { JoyInfo } from '@polkadot/joy-utils/JoyStatus';

type Props = ApiProps & I18nProps & DiscoveryProviderProps & RequiredMediaPlayerProps;

function newCancelSource(): CancelTokenSource {
  return axios.CancelToken.source()
}

function InnerComponent(props: Props) {
  const { contentId, api, discoveryProvider } = props

  const [ error, setError ] = useState<Error>()
  const [ resolvedAssetUrl, setResolvedAssetUrl ] = useState<string>()
  const [ contentType, setContentType ] = useState<string>()
  const [ cancelSource, setCancelSource ] = useState<CancelTokenSource>(newCancelSource())

  useEffect(() => {

    resolveAsset()

    return () => {
      cancelSource.cancel()
    }
  }, [ contentId.encode() ])

  const resolveAsset = async () => {
    setError(undefined)
    setCancelSource(newCancelSource())

    const rids: DataObjectStorageRelationshipId[] = await api.query.dataObjectStorageRegistry.relationshipsByContentId(contentId) as any;

    const allRelationships: Option<DataObjectStorageRelationship>[] = await Promise.all(rids.map((id) => api.query.dataObjectStorageRegistry.relationships(id))) as any;

    let readyProviders = allRelationships.filter(r => r.isSome).map(r => r.unwrap())
        .filter(r => r.ready)
        .map(r => r.storage_provider);

    // runtime doesn't currently guarantee unique set
    readyProviders = _.uniqBy(readyProviders, provider => provider.toString());

    if (!readyProviders.length) {
      setError(new Error('No Storage Providers found storing this content'))
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

    // loop over providers until we find one that responds
    while (readyProviders.length) {
      const provider = readyProviders.shift();
      if (!provider) continue;

      let assetUrl: string | undefined
      try {
        assetUrl = await discoveryProvider.resolveAssetEndpoint(provider, contentId.encode(), cancelSource.token);
      } catch (err) {
        if (axios.isCancel(err)) {
          return;
        } else {
          continue;
        }
      }

      try {
        console.log('Check URL of resolved asset:', assetUrl);
        const response = await axios.head(assetUrl, { cancelToken: cancelSource.token });

        setContentType(response.headers['content-type'] || 'video/video')
        setResolvedAssetUrl(assetUrl)

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

    setError(new Error('Unable to reach any provider serving this content'))
  }

  console.log('Content id:', contentId.encode())
  console.log('Resolved asset URL:', resolvedAssetUrl)

  if (error) {
    return (
      <Message error className='JoyMainStatus'>
        <Message.Header>Error loading media content</Message.Header>
        <p>{error.toString()}</p>
        <button className='ui button' onClick={resolveAsset}>Try again</button>
      </Message>
    );
  }

  if (!resolvedAssetUrl) {
    return <JoyInfo title={`Please wait...`}>Resolving media content.</JoyInfo>
  }

  const playerProps = { ...props, contentType, resolvedAssetUrl }
  return <MediaPlayerView {...playerProps} />
}

export const MediaPlayerWithResolver = withMulti(
  InnerComponent,
  translate,
  withDiscoveryProvider
)
