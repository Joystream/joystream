import React from 'react';
import { object, withKnobs } from '@storybook/addon-knobs';
import { Actor } from '@joystream/types/roles';
import { StorageAndDistribution } from "@polkadot/joy-roles/tabs/WorkingGroup"

import '@polkadot/joy-roles/index.css';

export default { 
    title: 'Roles / Working groups tab',
    decorators: [withKnobs],
};

export const StorageProvidersSection = () => {
	const storageProviders:Actor[] = [
		new Actor({member_id: 1, account: '5HZ6GtaeyxagLynPryM7ZnmLzoWFePKuDrkb4AT8rT4pU1fp'}),
		new Actor({member_id: 2, account: '5DQqNWRFPruFs9YKheVMqxUbqoXeMzAWfVfcJgzuia7NA3D3'}),
	];
	return (
		<div>
			<StorageAndDistribution actors={object('Storage providers',storageProviders)} />
		</div>
	)
}
