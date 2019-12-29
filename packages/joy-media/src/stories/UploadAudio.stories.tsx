import React from 'react';
import { EditForm } from '../upload/UploadAudio'
import '../index.css';

import { ContentId } from '@joystream/types/media';
import EntityId from '@joystream/types/versioned-store/EntityId';
import { UploadAudioView } from '../upload/UploadAudio.view';
import { withMockTransport } from './withMockTransport';

export default { 
    title: 'Media | Upload audio',
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
	<UploadAudioView
		isStorybook={true}
		contentId={contentId}
		id={new EntityId(1)}
	/>
