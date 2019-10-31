import React from 'react'
import { withKnobs } from '@storybook/addon-knobs'
import { Container } from 'semantic-ui-react';
import { ContentCuratorsSection, StorageProvidersSection } from './tabs/WorkingGroup.stories'

export default { 
	title: 'Roles / Tabs',
    decorators: [withKnobs],
}

export const WorkingGroup = () => {
	return (
		<div>
		<Container className="outer">
			<ContentCuratorsSection />
		</Container>
		<Container>
			<StorageProvidersSection />
		</Container>
			</div>
	)
}
