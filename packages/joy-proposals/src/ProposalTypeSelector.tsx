import React, { useState } from 'react'
import { Input, InputOnChangeData } from 'semantic-ui-react'
import { ProposalTypePreview, ProposalTypePreviewProps } from './ProposalTypePreview'
import Section from '@polkadot/joy-utils/Section'
import { nonEmptyStr } from '@polkadot/joy-utils/index'

type Props = {
  types: ProposalTypePreviewProps[]
}

type OnChangeCb = (event: React.ChangeEvent<HTMLInputElement>, data: InputOnChangeData) => void

function containsQuery(text?: string, query?: string): boolean {
  return text && query && nonEmptyStr(text) && nonEmptyStr(query)
    ? text.toLowerCase().indexOf(query) >= 0
    : true
}

export function ProposalTypeSelector (props: Props) {
  const { types = []} = props
  const [ filteredTypes, setFilteredTypes ] = useState<ProposalTypePreviewProps[]>(types)

  const onFilterProposal: OnChangeCb = (event, _data) => {
    const query = event.target.value
    console.log('onFilterProposal: query:', query)

    if (nonEmptyStr(query)) {
      setFilteredTypes(
        types.filter(x =>
          containsQuery(x.name, query) ||
          containsQuery(x.description, query)
        )
      )
    } else if (filteredTypes.length < types.length) {
      setFilteredTypes(types)
    }
  }

  return (
    <Section title={`Choose a proposal type...`}>
      <Input
        icon='search'
        iconPosition='left'
        placeholder='Filter proposal types...'
        onChange={onFilterProposal}
      />
      {filteredTypes.map((x) =>
        <ProposalTypePreview key={x.name} {...x} />
      )}
    </Section>
  )
}
