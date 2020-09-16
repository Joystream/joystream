import React from 'react';
import '../common/index.scss';

import ExploreContent from '../explore/ExploreContent.view';
import { withMockTransport } from './withMockTransport';

export default {
  title: 'Media | Explore',
  decorators: [withMockTransport]
};

export const DefaultState = () =>
  <ExploreContent />;
