import React from 'react';
import { EditForm } from './UploadVideo'
import '../index.css';

import { withKnobs } from '@storybook/addon-knobs';
import { Option } from '@polkadot/types/codec';
import { ContentId, ContentMetadata } from '@joystream/types/media';
import { newContentMetadata } from './ContentMetadataHelper';

export default { 
    title: 'Media | Upload video',
    decorators: [withKnobs],
};

export const DefaultState = () => {
	return <EditForm
		isStorybook={true}
		contentId={ContentId.generate()} 
	/>;
}

export const CharlieChaplinFilm = () => {
	return <EditForm
		isStorybook={true}
		contentId={ContentId.generate()}
		metadataOpt={newCharlieChaplinFilm()}
	/>;
}

function newCharlieChaplinFilm(): Option<ContentMetadata> {
	const owner =  '5HZ6GtaeyxagLynPryM7ZnmLzoWFePKuDrkb4AT8rT4pU1fp'
	const name = 'Modern Times (film) by Charlie Chaplin'
	const description = 'Modern Times is a 1936 American comedy film written and directed by Charlie Chaplin in which his iconic Little Tramp character struggles to survive in the modern, industrialized world. The film is a comment on the desperate employment and financial conditions many people faced during the Great Depression — conditions created, in Chaplins view, by the efficiencies of modern industrialization. The movie stars Chaplin, Paulette Goddard, Henry Bergman, Tiny Sandford and Chester Conklin.'
	const thumbnail = 'https://upload.wikimedia.org/wikipedia/commons/3/36/Modern_Times_poster.jpg'
	const keywords = 'comedy, movie, black and white'

	return new Option(ContentMetadata, newContentMetadata({
		owner,
		block: 123,
		time: 1572946770,
		name,
		description,
		thumbnail,
		keywords
	}));
}
