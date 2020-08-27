import React from 'react';
import { EditForm } from '../upload/UploadVideo';
import '../index.scss';

import { ContentId } from '@joystream/types/media';
import { withMockTransport } from './withMockTransport';
import EditVideoView from '../upload/EditVideo.view';
import { createMock, mockRegistry } from '@joystream/types';

export default {
  title: 'Media | Upload video',
  decorators: [withMockTransport]
};

const contentId = ContentId.generate(mockRegistry);

export const DefaultState = () =>
  <EditForm
    contentId={contentId}
  />;

export const MockEditFormView = () =>
  <EditVideoView
    contentId={contentId}
    id={createMock('EntityId', 1)}
  />;
