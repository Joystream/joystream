import React from "react";

import { History } from "history";
import { Item, Icon, Button } from "semantic-ui-react";

import { Category } from "./ChooseProposalType";
import { ProposalType } from "../runtime";
import { slugify, splitOnUpperCase } from "../utils";
import { formatBalance } from "@polkadot/util";

import "./ProposalType.css";

export type ProposalTypeInfo = {
  type: ProposalType;
  category: Category;
  image: string;
  description: string;
  stake: number;
  cancellationFee?: number;
  gracePeriod: number;
  votingPeriod: number;
};

type ProposalTypePreviewProps = {
  typeInfo: ProposalTypeInfo;
  history: History;
};

const ProposalTypeDetail = (props: { title: string, value: string }) => (
  <div className="proposal-detail">
    <div className="detail-title">{ `${props.title}:` }</div>
    <div className="detail-value">{ props.value }</div>
  </div>
);

export default function ProposalTypePreview(props: ProposalTypePreviewProps) {
  const {
    typeInfo: { type, description, stake, cancellationFee, gracePeriod, votingPeriod }
  } = props;

  const handleClick = () => {
    if (!props.history) return;
    props.history.push(`/proposals/new/${slugify(type)}`);
  };

  return (
    <Item className="ProposalType">
      {/*
        TODO: We can add it once we have the actual assets
        <Item.Image size="tiny" src={image} />
      */}
      <Item.Content>
        <Item.Header>{splitOnUpperCase(type).join(" ")}</Item.Header>
        <Item.Description>{description}</Item.Description>
        <div className="proposal-details">
          <ProposalTypeDetail
            title="Stake"
            value={ formatBalance(stake) } />
          <ProposalTypeDetail
            title="Cancellation fee"
            value={ cancellationFee ? formatBalance(cancellationFee) : "NONE" } />
          <ProposalTypeDetail
            title="Grace period"
            value={ gracePeriod ? `${gracePeriod} block${gracePeriod > 1 ? "s" : ""}` : "NONE" } />
          <ProposalTypeDetail
            title="Voting period"
            value={ votingPeriod ? `${votingPeriod} block${votingPeriod > 1 ? "s" : ""}` : "NONE" } />
        </div>
      </Item.Content>
      <div className="actions">
        <Button primary className="btn-create" size="medium" onClick={handleClick}>
          Create
          <Icon name="chevron right" />
        </Button>
      </div>
    </Item>
  );
}
