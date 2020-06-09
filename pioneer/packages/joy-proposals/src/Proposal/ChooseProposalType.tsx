import React, { useState } from 'react';
import ProposalTypePreview from './ProposalTypePreview';
import { Item, Dropdown } from 'semantic-ui-react';

import { useTransport, usePromise } from '@polkadot/joy-utils/react/hooks';
import { PromiseComponent } from '@polkadot/joy-utils/react/components';
import './ChooseProposalType.css';
import { RouteComponentProps } from 'react-router-dom';

export const Categories = {
  storage: 'Storage',
  council: 'Council',
  validators: 'Validators',
  cwg: 'Content Working Group',
  other: 'Other'
} as const;

export type Category = typeof Categories[keyof typeof Categories];

export default function ChooseProposalType (props: RouteComponentProps) {
  const transport = useTransport();

  const [proposalTypes, error, loading] = usePromise(() => transport.proposals.proposalsTypesParameters(), []);
  const [category, setCategory] = useState('');

  console.log({ proposalTypes, loading, error });
  return (
    <div className="ChooseProposalType">
      <PromiseComponent error={error} loading={loading} message={'Fetching proposals\' parameters...'}>
        <div className="filters">
          <Dropdown
            placeholder="Category"
            options={Object.values(Categories).map(category => ({ value: category, text: category }))}
            value={category}
            onChange={(e, data) => setCategory((data.value || '').toString())}
            clearable
            selection
          />
        </div>
        <Item.Group>
          {proposalTypes
            .filter(typeInfo => !category || typeInfo.category === category)
            .map((typeInfo, idx) => (
              <ProposalTypePreview key={`${typeInfo} - ${idx}`} typeInfo={typeInfo} history={props.history} />
            ))}
        </Item.Group>
      </PromiseComponent>
    </div>
  );
}
