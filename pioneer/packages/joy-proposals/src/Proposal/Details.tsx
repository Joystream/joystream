import React from "react";
import { Item, Header } from "semantic-ui-react";
import { ParsedProposal } from "@polkadot/joy-utils/types/proposals";
import { ExtendedProposalStatus } from "./ProposalDetails";
import styled from 'styled-components';

import ProfilePreview from "@polkadot/joy-utils/MemberProfilePreview";

const BlockInfo = styled.div`
  font-size: 0.9em;
`;

type DetailProps = {
  name: string,
  value?: string
};

const Detail: React.FunctionComponent<DetailProps> = ({name, value, children}) => (
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

export default function Details({ proposal, extendedStatus, proposerLink = false }: DetailsProps) {
  const { type, createdAt, createdAtBlock, proposer } = proposal;
  const { displayStatus, periodStatus, expiresIn, finalizedAtBlock, executedAtBlock, executionFailReason } = extendedStatus;
  console.log(proposal);
  return (
    <Item.Group className="details-container">
      <Detail name="Proposed By">
        <ProfilePreview
          avatar_uri={proposer.avatar_uri}
          root_account={proposer.root_account}
          handle={proposer.handle}
          link={ proposerLink }
        />
        <Item.Extra>{ `${ createdAt.toLocaleString() }` }</Item.Extra>
      </Detail>
      <Detail name="Proposal type" value={type} />
      <Detail name="Stage" value={displayStatus}>
        <Item.Extra>
          { createdAtBlock && <BlockInfo>Created at block <b>#{ createdAtBlock }</b></BlockInfo> }
          { finalizedAtBlock && <BlockInfo>Finalized at block <b>#{ finalizedAtBlock }</b></BlockInfo> }
          { executedAtBlock && (
            <BlockInfo>
              { displayStatus === "ExecutionFailed" ? 'Execution failed at' : 'Executed at' } block
              <b> #{ executedAtBlock }</b>
            </BlockInfo>
          ) }
        </Item.Extra>
      </Detail>
      { (periodStatus !== null) && <Detail name="Substage" value={periodStatus} /> }
      {expiresIn !== null && (
        <Detail
          name={ periodStatus === 'Grace period' ? 'Executes in' : 'Expires in' }
          value={`${expiresIn.toLocaleString("en-US")} blocks`} />
      ) }
      {executionFailReason && <Detail name="Execution error" value={ executionFailReason } /> }
    </Item.Group>
  );
}
