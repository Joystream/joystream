import React from 'react';
import { EditForm } from '../upload/UploadAudio';
import '../index.scss';

import { ContentId } from '@joystream/types/media';
import { UploadAudioView } from '../upload/UploadAudio.view';
import { withMockTransport } from './withMockTransport';
import { registry, createType } from '@joystream/types';

export default {
  title: 'Media | Upload audio',
  decorators: [withMockTransport]
};

const contentId = ContentId.generate(registry);

export const DefaultState = () =>
  <EditForm
    contentId={contentId}
  />;

export const MockEditFormView = () =>
  <UploadAudioView
    contentId={contentId}
    id={createType('EntityId', 1)}
  />;
