import React from 'react';
import '../common/index.css';

import { ExploreContent } from '../explore/ExploreContent';
import { withMockTransport } from './withMockTransport';

export default {
  title: 'Media | Explore',
  decorators: [withMockTransport]
};

export const DefaultState = () =>
  <ExploreContent />;
