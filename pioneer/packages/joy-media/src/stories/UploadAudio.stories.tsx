import React from 'react';
import { EditForm } from '../upload/UploadAudio';
import '../index.css';

import { ContentId } from '@joystream/types/media';
import { UploadAudioView } from '../upload/UploadAudio.view';
import { withMockTransport } from './withMockTransport';
import { mockRegistry, createMock } from '@joystream/types';

export default {
  title: 'Media | Upload audio',
  decorators: [withMockTransport]
};

const contentId = ContentId.generate(mockRegistry);

export const DefaultState = () =>
  <EditForm
    contentId={contentId}
  />;

export const MockEditFormView = () =>
  <UploadAudioView
    contentId={contentId}
    id={createMock('EntityId', 1)}
  />;
