import React from 'react';
import { EditForm } from '../upload/UploadAudio'
import '../index.css';

import { ContentId } from '@joystream/types/lib/media';
import EntityId from '@joystream/types/lib/versioned-store/EntityId';
import { UploadAudioView } from '../upload/UploadAudio.view';
import { withMockTransport } from './withMockTransport';

export default { 
	title: 'Media | Upload audio',
	decorators: [ withMockTransport ],
};

const contentId = ContentId.generate();

export const DefaultState = () =>
	<EditForm
		contentId={contentId} 
	/>;

export const MockEditFormView = () =>
	<UploadAudioView
		contentId={contentId}
		id={new EntityId(1)}
	/>;
