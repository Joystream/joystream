import React, { useState, useEffect } from 'react';
import axios, { CancelTokenSource } from 'axios';
import _ from 'lodash';

import { ApiProps } from '@polkadot/react-api/types';
import { I18nProps } from '@polkadot/react-components/types';
import { withMulti } from '@polkadot/react-api/with';
import { Option } from '@polkadot/types/codec';
import { StorageProviderId, Worker } from '@joystream/types/working-group';

import translate from '../translate';
import { DiscoveryProviderProps, withDiscoveryProvider } from '../DiscoveryProvider';
import { DataObjectStorageRelationshipId, DataObjectStorageRelationship } from '@joystream/types/media';
import { Message } from 'semantic-ui-react';
import { MediaPlayerView, RequiredMediaPlayerProps } from './MediaPlayerView';
import { JoyInfo } from '@polkadot/joy-utils/JoyStatus';
import { MultipleLinkedMapEntry } from '@polkadot/joy-utils/index';

type Props = ApiProps & I18nProps & DiscoveryProviderProps & RequiredMediaPlayerProps;

function newCancelSource (): CancelTokenSource {
  return axios.CancelToken.source();
}

function InnerComponent (props: Props) {
  const { contentId, api, discoveryProvider } = props;

  const [error, setError] = useState<Error>();
  const [resolvedAssetUrl, setResolvedAssetUrl] = useState<string>();
  const [contentType, setContentType] = useState<string>();
  const [cancelSource, setCancelSource] = useState<CancelTokenSource>(newCancelSource());

  const getActiveStorageProviderIds = async (): Promise<StorageProviderId[]> => {
    const nextId = await api.query.storageWorkingGroup.nextWorkerId() as StorageProviderId;
    // This is chain specfic, but if next id is still 0, it means no workers have been added,
    // so the workerById is empty
    if (nextId.eq(0)) {
      return [];
    }

    const workers = new MultipleLinkedMapEntry<StorageProviderId, Worker>(
      StorageProviderId,
      Worker,
      await api.query.storageWorkingGroup.workerById()
    );

    return workers.linked_keys;
  };

  const resolveAsset = async () => {
    setError(undefined);
    setCancelSource(newCancelSource());

    const rids: DataObjectStorageRelationshipId[] = await api.query.dataObjectStorageRegistry.relationshipsByContentId(contentId) as any;

    const allRelationships: Option<DataObjectStorageRelationship>[] = await Promise.all(rids.map((id) => api.query.dataObjectStorageRegistry.relationships(id))) as any;

    // Providers that have signalled onchain that they have the asset
    let readyProviders = allRelationships.filter(r => r.isSome).map(r => r.unwrap())
      .filter(r => r.ready)
      .map(r => r.storage_provider);

    // runtime doesn't currently guarantee unique set
    readyProviders = _.uniqBy(readyProviders, provider => provider.toString());

    if (!readyProviders.length) {
      setError(new Error('No Storage Providers found storing this content'));
      return;
    }

    // filter out providers no longer active - relationships of providers that have left
    // are not pruned onchain.
    const activeProviders = await getActiveStorageProviderIds();
    readyProviders = _.intersectionBy(activeProviders, readyProviders, provider => provider.toString());

    console.log(`Found ${readyProviders.length} providers ready to serve content: ${readyProviders}`);

    // shuffle to spread the load
    readyProviders = _.shuffle(readyProviders);

    // TODO: prioritize already resolved providers, least reported unreachable, closest
    // by geography etc..

    // loop over providers until we find one that responds
    while (readyProviders.length) {
      const provider = readyProviders.shift();
      if (!provider) continue;

      let assetUrl: string | undefined;
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

        setContentType(response.headers['content-type'] || 'video/video');
        setResolvedAssetUrl(assetUrl);

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

    setError(new Error('Unable to reach any provider serving this content'));
  };

  useEffect(() => {
    resolveAsset();

    return () => {
      cancelSource.cancel();
    };
  }, [contentId.encode()]);

  console.log('Content id:', contentId.encode());
  console.log('Resolved asset URL:', resolvedAssetUrl);

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
    return <JoyInfo title={'Please wait...'}>Resolving media content.</JoyInfo>;
  }

  const playerProps = { ...props, contentType, resolvedAssetUrl };
  return <MediaPlayerView {...playerProps} />;
}

export const MediaPlayerWithResolver = withMulti(
  InnerComponent,
  translate,
  withDiscoveryProvider
);
