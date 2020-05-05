import React from "react";
import { Item, Header } from "semantic-ui-react";
import { ParsedProposal } from "../runtime/transport";
import { ExtendedProposalStatus } from "./ProposalDetails";

import ProfilePreview from "./ProfilePreview";

type DetailsProps = {
  proposal: ParsedProposal;
  extendedStatus: ExtendedProposalStatus;
};

export default function Details({ proposal, extendedStatus }: DetailsProps) {
  const { type, createdAt, proposer } = proposal;
  const { displayStatus, periodStatus, expiresIn } = extendedStatus;
  return (
    <Item.Group className="details-container">
      <Item>
        <Item.Content>
          <Item.Extra>Proposed By:</Item.Extra>
          <ProfilePreview
            avatar_uri={proposer.avatar_uri}
            root_account={proposer.root_account}
            handle={proposer.handle}
          />
          <Item.Extra>{createdAt.toLocaleString()}</Item.Extra>
        </Item.Content>
      </Item>
      <Item>
        <Item.Content>
          <Item.Extra>Proposal Type:</Item.Extra>
          <Header as="h4">{type}</Header>
        </Item.Content>
      </Item>
      <Item>
        <Item.Content>
          <Item.Extra>Stage:</Item.Extra>
          <Header as="h4">{ displayStatus }</Header>
        </Item.Content>
      </Item>
      { (periodStatus !== null) && (
        <Item>
          <Item.Content>
            <Item.Extra>Substage:</Item.Extra>
            <Header as="h4">{ periodStatus }</Header>
          </Item.Content>
        </Item>
      )}
      {expiresIn !== null && (
        <Item>
          <Item.Content>
            <Item.Extra>Expires in:</Item.Extra>
            <Header as="h4">{`${expiresIn.toLocaleString("en-US")} blocks`}</Header>
          </Item.Content>
        </Item>
      )}
    </Item.Group>
  );
}
