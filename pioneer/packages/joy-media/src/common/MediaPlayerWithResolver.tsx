import React, { useState, useEffect } from 'react';
import axios, { CancelTokenSource, AxiosError } from 'axios';
import _ from 'lodash';

import { ApiProps } from '@polkadot/react-api/types';
import { I18nProps } from '@polkadot/react-components/types';
import { withMulti } from '@polkadot/react-api/hoc';
import { Option, Vec } from '@polkadot/types/codec';

import translate from '../translate';
import { DiscoveryProviderProps, withDiscoveryProvider } from '../DiscoveryProvider';
import { DataObjectStorageRelationshipId, DataObjectStorageRelationship } from '@joystream/types/media';
import { Message } from 'semantic-ui-react';
import { MediaPlayerView, RequiredMediaPlayerProps } from './MediaPlayerView';
import { JoyInfo } from '@polkadot/joy-utils/react/components';
import { useTransport } from '@polkadot/joy-utils/react/hooks';
import { isObjectWithProperties } from '@polkadot/joy-utils/functions/misc';

type Props = ApiProps & I18nProps & DiscoveryProviderProps & RequiredMediaPlayerProps;

function newCancelSource (): CancelTokenSource {
  return axios.CancelToken.source();
}

function InnerComponent (props: Props) {
  const { contentId, api, discoveryProvider } = props;
  const transport = useTransport();

  const [error, setError] = useState<Error>();
  const [resolvedAssetUrl, setResolvedAssetUrl] = useState<string>();
  const [contentType, setContentType] = useState<string>();
  const [cancelSource, setCancelSource] = useState<CancelTokenSource>(newCancelSource());

  const resolveAsset = async () => {
    setError(undefined);
    setCancelSource(newCancelSource());

    const rids = await api.query.dataObjectStorageRegistry.relationshipsByContentId<Vec<DataObjectStorageRelationshipId>>(contentId);

    const allRelationships = await Promise.all(
      rids.map((id) =>
        api.query.dataObjectStorageRegistry.relationships<Option<DataObjectStorageRelationship>>(id)
      )
    );

    // Providers that have signalled onchain that they have the asset
    let readyProviders = allRelationships.filter((r) => r.isSome).map((r) => r.unwrap())
      .filter((r) => r.ready)
      .map((r) => r.storage_provider);

    // runtime doesn't currently guarantee unique set
    readyProviders = _.uniqBy(readyProviders, (provider) => provider.toString());

    if (!readyProviders.length) {
      setError(new Error('No Storage Providers found storing this content'));

      return;
    }

    const activeProviders = (await transport.workingGroups.allWorkers('Storage')).map(([id]) => id);

    // filter out providers no longer active - relationships of providers that have left
    // are not pruned onchain.
    readyProviders = _.intersectionBy(activeProviders, readyProviders, (provider) => provider.toString());

    console.log(`Found ${readyProviders.length} providers ready to serve content: ${readyProviders.join(', ')}`);

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
        const headers = response.headers as Record<string, string | undefined>;

        setContentType(headers['content-type'] || 'video/video');
        setResolvedAssetUrl(assetUrl);

        return;
      } catch (e) {
        const err = e as unknown;

        if (axios.isCancel(err)) {
          return;
        } else {
          const response = isObjectWithProperties(err, 'response')
            ? (err as AxiosError).response
            : undefined;

          if (!response || (response.status >= 500 && response.status <= 504)) {
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
    void resolveAsset();

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
