import React from "react";
import { Item, Image, Header } from "semantic-ui-react";
import { ParsedProposal } from "../runtime/transport";
import { IdentityIcon } from '@polkadot/react-components';
import { BlockNumber } from '@polkadot/types/interfaces';

type DetailsProps = {
  proposal: ParsedProposal,
  bestNumber?: BlockNumber
};

export default function Details({
  proposal: { type, createdAt, createdAtBlock, proposer, status, parameters },
  bestNumber
}: DetailsProps) {
  const statusStr = Object.keys(status)[0];
  const isActive = statusStr === 'Active';
  const { votingPeriod, gracePeriod } = parameters;

  const blockAge = bestNumber ? (bestNumber.toNumber() - createdAtBlock) : 0;
  const substage = isActive && (
    votingPeriod - blockAge  > 0 ?
      'Voting period'
      : 'Grace period'
  );
  const expiresIn = substage && (
    substage === 'Voting period' ?
      votingPeriod - blockAge
      : (gracePeriod + votingPeriod) - blockAge
  )
  return (
    <Item.Group className="details-container">
      <Item>
        <Item.Content>
          <Item.Extra>Proposed By:</Item.Extra>
          { proposer.avatar_uri ?
            <Image src={ proposer.avatar_uri } avatar floated="left" />
            : <IdentityIcon className="image" value={proposer.root_account} size={40} /> }
          <Header as="h4">{ proposer.handle }</Header>
          <Item.Extra>{ createdAt.toLocaleString() }</Item.Extra>
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
          <Header as="h4">{ statusStr }</Header>
        </Item.Content>
      </Item>
      { isActive && (
        <Item>
          <Item.Content>
            <Item.Extra>Substage:</Item.Extra>
            <Header as="h4">{ substage }</Header>
          </Item.Content>
        </Item>
      ) }
      { isActive && (
        <Item>
          <Item.Content>
            <Item.Extra>Expires in:</Item.Extra>
            <Header as="h4">{`${ expiresIn } blocks`}</Header>
          </Item.Content>
        </Item>
      ) }
    </Item.Group>
  );
}
