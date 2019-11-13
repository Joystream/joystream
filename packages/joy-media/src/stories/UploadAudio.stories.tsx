import React from 'react';
import { EditForm } from '../upload/UploadAudio'
import '../index.css';

import { withKnobs } from '@storybook/addon-knobs';
import { ContentId } from '@joystream/types/media';
import { MusicTrackEntity } from '../entities/MusicTrackEntity';

export default { 
    title: 'Media | Upload audio',
    decorators: [withKnobs],
};

export const DefaultState = () => {
	return <EditForm
		isStorybook={true}
		contentId={ContentId.generate()} 
	/>;
}

export const RequiemByMozart = () => {
	return <EditForm
		isStorybook={true}
		contentId={ContentId.generate()}
		entity={newAudioTrack()}
	/>;
}

function newAudioTrack(): MusicTrackEntity {
	return {
		title: 'Requiem (Mozart)',
		description: 'The Requiem in D minor, K. 626, is a requiem mass by Wolfgang Amadeus Mozart (1756–1791). Mozart composed part of the Requiem in Vienna in late 1791, but it was unfinished at his death on 5 December the same year. A completed version dated 1792 by Franz Xaver Süssmayr was delivered to Count Franz von Walsegg, who commissioned the piece for a Requiem service to commemorate the anniversary of his wifes death on 14 February.',
		thumbnail: 'https://assets.classicfm.com/2017/36/mozart-1504532179-list-handheld-0.jpg',

		// visibility: 'Public',
		// album: 'Greatest Collection of Mozart',
	
		// Additional:
		artist: 'Berlin Philharmonic',
		composer: 'Wolfgang Amadeus Mozart',
		genre: 'Classical Music',
		mood: 'Relaxing',
		theme: 'Dark',
		explicit: false,
		license: 'Public Domain',
	};
}
