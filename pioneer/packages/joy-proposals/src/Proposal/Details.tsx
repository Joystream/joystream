import React from 'react';
import { Item, Header, Label } from 'semantic-ui-react';
import { ParsedProposal } from '@polkadot/joy-utils/types/proposals';
import { metadata as proposalConsts } from '@polkadot/joy-utils/consts/proposals';
import { ExtendedProposalStatus } from './ProposalDetails';
import styled from 'styled-components';

import ProfilePreview from '@polkadot/joy-utils/MemberProfilePreview';

const DetailsContainer = styled(Item.Group)`
  display: grid;
  width: auto;
  grid-template-columns: repeat(5, auto) 1fr;
  grid-column-gap: 5rem;

  & .item .extra {
    margin-bottom: 0.5em !important;
  }

  @media screen and (max-width: 1199px) {
    grid-template-columns: repeat(3, auto);
    grid-template-rows: repeat(2, auto);

    & .item:first-child {
      grid-row: 1/3;
    }

    & .item {
      margin: 0.5em 0 !important;
    }
  }

  @media screen and (max-width: 767px) {
    grid-template-columns: repeat(2, auto);
    grid-template-rows: repeat(3, auto);

    & .item:first-child {
      grid-column: 1/3;
    }

    & .item {
      margin: 0.5em 0 !important;
    }
  }
`;

const BlockInfo = styled.div`
  font-size: 0.9em;
`;

type DetailProps = {
  name: string;
  value?: string;
};

const Detail: React.FunctionComponent<DetailProps> = ({ name, value, children }) => (
  <Item>
    <Item.Content>
      <Item.Extra>{ name }:</Item.Extra>
      { value && <Header as="h4">{value}</Header> }
      { children }
    </Item.Content>
  </Item>
);

type DetailsProps = {
  proposal: ParsedProposal;
  extendedStatus: ExtendedProposalStatus;
  proposerLink?: boolean;
};

export default function Details ({ proposal, extendedStatus, proposerLink = false }: DetailsProps) {
  const { type, createdAt, createdAtBlock, proposer } = proposal;
  const { displayStatus, periodStatus, expiresIn, finalizedAtBlock, executedAtBlock, executionFailReason } = extendedStatus;
  return (
    <DetailsContainer>
      <Detail name="Proposed By">
        <ProfilePreview
          avatar_uri={proposer.avatar_uri}
          root_account={proposer.root_account}
          handle={proposer.handle}
          link={ proposerLink }
        />
        <Item.Extra>{ `${createdAt.toLocaleString()}` }</Item.Extra>
      </Detail>
      <Detail name="Proposal type" value={type}>
        <Item.Extra>{ proposalConsts[type].outdated && <Label size="small">Outdated proposal type</Label> }</Item.Extra>
      </Detail>
      <Detail name="Stage" value={displayStatus}>
        <Item.Extra>
          { createdAtBlock && <BlockInfo>Created at block <b>#{ createdAtBlock }</b></BlockInfo> }
          { finalizedAtBlock && <BlockInfo>Finalized at block <b>#{ finalizedAtBlock }</b></BlockInfo> }
          { executedAtBlock && (
            <BlockInfo>
              { displayStatus === 'ExecutionFailed' ? 'Execution failed at' : 'Executed at' } block
              <b> #{ executedAtBlock }</b>
            </BlockInfo>
          ) }
        </Item.Extra>
      </Detail>
      { (periodStatus !== null) && <Detail name="Substage" value={periodStatus} /> }
      {expiresIn !== null && (
        <Detail
          name={ periodStatus === 'Grace period' ? 'Executes in' : 'Expires in' }
          value={`${expiresIn.toLocaleString('en-US')} blocks`} />
      ) }
      {executionFailReason && <Detail name="Execution error" value={ executionFailReason } /> }
    </DetailsContainer>
  );
}
