import React, { useState } from 'react';
import { Button, Card, Container, Icon } from 'semantic-ui-react';
import styled from 'styled-components';
import { Link, useLocation } from 'react-router-dom';

import ProposalPreview from './ProposalPreview';
import { ParsedProposal } from '@polkadot/joy-utils/types/proposals';
import { useTransport, usePromise } from '@polkadot/joy-utils/react/hooks';
import { PromiseComponent } from '@polkadot/joy-utils/react/components';
import { withCalls } from '@polkadot/react-api';
import { BlockNumber } from '@polkadot/types/interfaces';
import { Dropdown } from '@polkadot/react-components';

const filters = ['All', 'Active', 'Canceled', 'Approved', 'Rejected', 'Slashed', 'Expired'] as const;

type ProposalFilter = typeof filters[number];

function filterProposals (filter: ProposalFilter, proposals: ParsedProposal[]) {
  if (filter === 'All') {
    return proposals;
  } else if (filter === 'Active') {
    return proposals.filter((prop: ParsedProposal) => {
      const [activeOrFinalized] = Object.keys(prop.status);
      return activeOrFinalized === 'Active';
    });
  }

  return proposals.filter((prop: ParsedProposal) => {
    if (prop.status.Finalized == null || prop.status.Finalized.proposalStatus == null) {
      return false;
    }

    const [finalStatus] = Object.keys(prop.status.Finalized.proposalStatus);
    return finalStatus === filter;
  });
}

function mapFromProposals (proposals: ParsedProposal[]) {
  const proposalsMap = new Map<ProposalFilter, ParsedProposal[]>();

  proposalsMap.set('All', proposals);
  proposalsMap.set('Canceled', filterProposals('Canceled', proposals));
  proposalsMap.set('Active', filterProposals('Active', proposals));
  proposalsMap.set('Approved', filterProposals('Approved', proposals));
  proposalsMap.set('Rejected', filterProposals('Rejected', proposals));
  proposalsMap.set('Slashed', filterProposals('Slashed', proposals));
  proposalsMap.set('Expired', filterProposals('Expired', proposals));

  return proposalsMap;
}

type ProposalPreviewListProps = {
  bestNumber?: BlockNumber;
};

const FilterContainer = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 1.75rem;
`;
const FilterOption = styled.span`
  display: inline-flex;
  align-items: center;
`;
const ProposalFilterCountBadge = styled.span`
  background-color: rgba(0, 0, 0, .3);
  color: #fff;

  border-radius: 10px;
  height: 19px;
  min-width: 19px;
  padding: 0 4px;

  font-size: .8rem;
  font-weight: 500;
  line-height: 1;

  display: flex;
  align-items: center;
  justify-content: center;

  margin-left: 6px;
`;
const StyledDropdown = styled(Dropdown)`
  .dropdown {
    width: 200px;
  }
`;

function ProposalPreviewList ({ bestNumber }: ProposalPreviewListProps) {
  const { pathname } = useLocation();
  const transport = useTransport();
  const [proposals, error, loading] = usePromise<ParsedProposal[]>(() => transport.proposals.proposals(), []);
  const [activeFilter, setActiveFilter] = useState<ProposalFilter>('All');

  const proposalsMap = mapFromProposals(proposals);
  const filteredProposals = proposalsMap.get(activeFilter) as ParsedProposal[];
  const sortedProposals = filteredProposals.sort((p1, p2) => p2.id.cmp(p1.id));

  const filterOptions = filters.map(filter => ({
    text: (
      <FilterOption>
        {filter}
        <ProposalFilterCountBadge>{(proposalsMap.get(filter) as ParsedProposal[]).length}</ProposalFilterCountBadge>
      </FilterOption>
    ),
    value: filter
  }));

  const _onChangePrefix = (f: ProposalFilter) => setActiveFilter(f);

  return (
    <Container className="Proposal" fluid>
      <FilterContainer>
        <Button primary as={Link} to={`${pathname}/new`}>
          <Icon name="add" />
          New proposal
        </Button>
        {!loading && (
          <StyledDropdown
            label="Proposal state"
            options={filterOptions}
            value={activeFilter}
            onChange={_onChangePrefix}
          />
        )}
      </FilterContainer>
      <PromiseComponent error={ error } loading={ loading } message="Fetching proposals...">
        {
          sortedProposals.length ? (
            <Card.Group>
              {sortedProposals.map((prop: ParsedProposal, idx: number) => (
                <ProposalPreview key={`${prop.title}-${idx}`} proposal={prop} bestNumber={bestNumber} />
              ))}
            </Card.Group>
          ) : `There are currently no ${activeFilter !== 'All' ? activeFilter.toLocaleLowerCase() : 'submitted'} proposals.`
        }
      </PromiseComponent>
    </Container>
  );
}

export default withCalls<ProposalPreviewListProps>(['derive.chain.bestNumber', { propName: 'bestNumber' }])(
  ProposalPreviewList
);
