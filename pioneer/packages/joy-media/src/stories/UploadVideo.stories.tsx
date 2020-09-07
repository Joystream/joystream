import React from 'react';
import { EditForm } from '../upload/UploadVideo';
import '../index.scss';

import { ContentId } from '@joystream/types/media';
import { withMockTransport } from './withMockTransport';
import EditVideoView from '../upload/EditVideo.view';
import { createType, registry } from '@joystream/types';

export default {
  title: 'Media | Upload video',
  decorators: [withMockTransport]
};

const contentId = ContentId.generate(registry);

export const DefaultState = () =>
  <EditForm
    contentId={contentId}
  />;

export const MockEditFormView = () =>
  <EditVideoView
    contentId={contentId}
    id={createType('EntityId', 1)}
  />;
