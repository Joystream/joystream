import React from 'react';

import { History } from 'history';
import { Item, Icon, Button, Label } from 'semantic-ui-react';

import { ProposalType, Category } from '@polkadot/joy-utils/types/proposals';
import _ from 'lodash';
import styled from 'styled-components';
import useVoteStyles from './useVoteStyles';
import { formatBalance } from '@polkadot/util';

import './ProposalType.css';

const QuorumsAndThresholds = styled.div`
  display: grid;
  grid-template-columns: min-content min-content;
  grid-template-rows: auto auto;
  grid-row-gap: 0.5rem;
  grid-column-gap: 0.5rem;
  margin-bottom: 1rem;
  @media screen and (max-width: 480px) {
    grid-template-columns: min-content;
  }
`;

const QuorumThresholdLabel = styled(Label)`
  opacity: 0.75;
  white-space: nowrap;
  margin: 0 !important;
  display: flex !important;
  align-items: center;
  & b {
    font-size: 1.2em;
    margin-left: auto;
    padding-left: 0.3rem;
  }
`;

const CreateButton = styled(Button)`
  font-size: 1.1em !important;
  white-space: nowrap;
  margin-right: 0;
`;

export type ProposalTypeInfo = {
  type: ProposalType;
  category: Category;
  description: string;
  stake: number;
  cancellationFee?: number;
  gracePeriod: number;
  votingPeriod: number;
  approvalQuorum: number;
  approvalThreshold: number;
  slashingQuorum: number;
  slashingThreshold: number;
};

type ProposalTypePreviewProps = {
  typeInfo: ProposalTypeInfo;
  history: History;
};

const ProposalTypeDetail = (props: { title: string; value: string }) => (
  <div className="proposal-detail">
    <div className="detail-title">{ `${props.title}:` }</div>
    <div className="detail-value">{ props.value }</div>
  </div>
);

export default function ProposalTypePreview (props: ProposalTypePreviewProps) {
  const {
    typeInfo: {
      type,
      description,
      stake,
      cancellationFee,
      gracePeriod,
      votingPeriod,
      approvalQuorum,
      approvalThreshold,
      slashingQuorum,
      slashingThreshold
    }
  } = props;

  const handleClick = () => {
    if (!props.history) return;
    props.history.push(`/proposals/new/${_.kebabCase(type)}`);
  };

  return (
    <Item className="ProposalType">
      {/*
        TODO: We can add it once we have the actual assets
        <Item.Image size="tiny" src={image} />
      */}
      <Item.Content>
        <Item.Header>{_.startCase(type)}</Item.Header>
        <Item.Description>{description}</Item.Description>
        <div className="proposal-details">
          <ProposalTypeDetail
            title="Stake"
            value={ formatBalance(stake) } />
          <ProposalTypeDetail
            title="Cancellation fee"
            value={ cancellationFee ? formatBalance(cancellationFee) : 'NONE' } />
          <ProposalTypeDetail
            title="Grace period"
            value={ gracePeriod ? `${gracePeriod} block${gracePeriod > 1 ? 's' : ''}` : 'NONE' } />
          <ProposalTypeDetail
            title="Voting period"
            value={ votingPeriod ? `${votingPeriod} block${votingPeriod > 1 ? 's' : ''}` : 'NONE' } />
        </div>
        <QuorumsAndThresholds>
          { approvalQuorum && (
            <QuorumThresholdLabel color={ useVoteStyles('Approve').color }>
              <Icon name={ useVoteStyles('Approve').icon } />
              Approval Quorum: <b>{ approvalQuorum }%</b>
            </QuorumThresholdLabel>
          ) }
          { approvalThreshold && (
            <QuorumThresholdLabel color={ useVoteStyles('Approve').color }>
              <Icon name={ useVoteStyles('Approve').icon } />
              Approval Threshold: <b>{ approvalThreshold }%</b>
            </QuorumThresholdLabel>
          ) }
          { slashingQuorum && (
            <QuorumThresholdLabel color={ useVoteStyles('Slash').color }>
              <Icon name={ useVoteStyles('Slash').icon } />
              Slashing Quorum: <b>{ slashingQuorum }%</b>
            </QuorumThresholdLabel>
          ) }
          { slashingThreshold && (
            <QuorumThresholdLabel color={ useVoteStyles('Slash').color }>
              <Icon name={ useVoteStyles('Slash').icon } />
              Slashing Threshold: <b>{ slashingThreshold }%</b>
            </QuorumThresholdLabel>
          ) }
        </QuorumsAndThresholds>
      </Item.Content>
      <div className="actions">
        <CreateButton primary size="medium" onClick={handleClick}>
          Create
          <Icon name="chevron right" />
        </CreateButton>
      </div>
    </Item>
  );
}
