import React from 'react';
import { EditForm } from '../upload/UploadVideo'
import '../index.css';

import { ContentId } from '@joystream/types/lib/media';
import { withMockTransport } from './withMockTransport';
import EditVideoView from '../upload/EditVideo.view';
import EntityId from '@joystream/types/lib/versioned-store/EntityId';

export default { 
	title: 'Media | Upload video',
	decorators: [ withMockTransport ],
};

const contentId = ContentId.generate();

export const DefaultState = () =>
	<EditForm
		contentId={contentId} 
	/>;

export const MockEditFormView = () =>
	<EditVideoView
		contentId={contentId}
		id={new EntityId(1)}
	/>;
