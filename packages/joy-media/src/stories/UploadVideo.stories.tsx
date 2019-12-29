import React from 'react';
import { EditForm } from '../upload/UploadVideo'
import '../index.css';

import { ContentId } from '@joystream/types/media';
import { withMockTransport } from './withMockTransport';
import UploadVideoView from '../upload/UploadVideo.view';
import EntityId from '@joystream/types/versioned-store/EntityId';

export default { 
	title: 'Media | Upload video',
	decorators: [ withMockTransport ],
};

const contentId = ContentId.generate();

export const DefaultState = () => {
	return <EditForm
		isStorybook={true}
		contentId={contentId} 
	/>;
}

export const MockEditFormView = () =>
	<UploadVideoView
		isStorybook={true}
		contentId={contentId}
		id={new EntityId(1)}
	/>
