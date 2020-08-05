import React, { useState } from 'react';
import { Button, Card, Container, Icon, Pagination } from 'semantic-ui-react';
import styled from 'styled-components';
import { Link, useLocation } from 'react-router-dom';

import ProposalPreview from './ProposalPreview';
import { ParsedProposal, proposalStatusFilters, ProposalStatusFilter, ProposalsBatch } from '@polkadot/joy-utils/types/proposals';
import { useTransport, usePromise } from '@polkadot/joy-utils/react/hooks';
import { PromiseComponent } from '@polkadot/joy-utils/react/components';
import { withCalls } from '@polkadot/react-api';
import { BlockNumber } from '@polkadot/types/interfaces';
import { Dropdown } from '@polkadot/react-components';

type ProposalPreviewListProps = {
  bestNumber?: BlockNumber;
};

const FilterContainer = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 1.75rem;
`;
const StyledDropdown = styled(Dropdown)`
  .dropdown {
    width: 200px;
  }
`;
const PaginationBox = styled.div`
  margin-bottom: 1em;
`;

function ProposalPreviewList ({ bestNumber }: ProposalPreviewListProps) {
  const { pathname } = useLocation();
  const transport = useTransport();
  const [activeFilter, setActiveFilter] = useState<ProposalStatusFilter>('All');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [proposalsBatch, error, loading] = usePromise<ProposalsBatch | undefined>(
    () => transport.proposals.proposalsBatch(activeFilter, currentPage),
    undefined,
    [activeFilter, currentPage]
  );

  const filterOptions = proposalStatusFilters.map(filter => ({
    text: filter,
    value: filter
  }));

  const _onChangePrefix = (f: ProposalStatusFilter) => {
    setCurrentPage(1);
    setActiveFilter(f);
  };

  return (
    <Container className="Proposal" fluid>
      <FilterContainer>
        <Button primary as={Link} to={`${pathname}/new`}>
          <Icon name="add" />
          New proposal
        </Button>
        <StyledDropdown
          label="Proposal state"
          options={filterOptions}
          value={activeFilter}
          onChange={_onChangePrefix}
        />
      </FilterContainer>
      <PromiseComponent error={ error } loading={ loading } message="Fetching proposals...">
        { proposalsBatch && (<>
          <PaginationBox>
            { proposalsBatch.totalBatches > 1 && (
              <Pagination
                activePage={ currentPage }
                ellipsisItem={{ content: <Icon name='ellipsis horizontal' />, icon: true }}
                firstItem={{ content: <Icon name='angle double left' />, icon: true }}
                lastItem={{ content: <Icon name='angle double right' />, icon: true }}
                prevItem={{ content: <Icon name='angle left' />, icon: true }}
                nextItem={{ content: <Icon name='angle right' />, icon: true }}
                totalPages={ proposalsBatch.totalBatches }
                onPageChange={ (e, data) => setCurrentPage((data.activePage && parseInt(data.activePage.toString())) || 1) }
              />
            ) }
          </PaginationBox>
           { proposalsBatch.proposals.length
             ? (
               <Card.Group>
                 {proposalsBatch.proposals.map((prop: ParsedProposal, idx: number) => (
                   <ProposalPreview key={`${prop.title}-${idx}`} proposal={prop} bestNumber={bestNumber} />
                 ))}
               </Card.Group>
             )
             : `There are currently no ${activeFilter !== 'All' ? activeFilter.toLocaleLowerCase() : 'submitted'} proposals.`
           }
        </>) }
      </PromiseComponent>
    </Container>
  );
}

export default withCalls<ProposalPreviewListProps>(['derive.chain.bestNumber', { propName: 'bestNumber' }])(
  ProposalPreviewList
);
