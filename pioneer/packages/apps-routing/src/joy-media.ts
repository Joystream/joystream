import Media from '@polkadot/joy-media/index';

import { Route } from './types';

export default function create (t: <T = string> (key: string, text: string, options: { ns: string }) => T): Route {
  return {
    Component: Media,
    display: {
      needsApi: ['query.storageWorkingGroup.workerById', 'query.dataObjectStorageRegistry.relationshipsByContentId']
    },
    text: t<string>('nav.media', 'Media', { ns: 'apps-routing' }),
    icon: 'play-circle',
    name: 'media'
  };
}
