import React from "react";

import { History } from "history";
import { Item, Icon, Button } from "semantic-ui-react";

import { Category } from "./ChooseProposalType";
import { ProposalType } from "../runtime";
import { slugify, splitOnUpperCase } from "../utils";

import "./ProposalType.css";

export type ProposalTypeInfo = {
  type: ProposalType;
  category: Category;
  image: string;
  description: string;
  stake: number;
  cancellationFee?: number;
  gracePeriod: number;
};

type ProposalTypePreviewProps = {
  typeInfo: ProposalTypeInfo;
  history: History;
};

export default function ProposalTypePreview(props: ProposalTypePreviewProps) {
  const {
    typeInfo: { type, image, description, stake, cancellationFee, gracePeriod }
  } = props;

  const handleClick = () => {
    console.log(`Clicked, should go to ${slugify(type)}`);
    if (!props.history) return;
    props.history.push(`/proposals/new/${slugify(type)}`);
  };

  return (
    <Item className="ProposalType">
      <Item.Image size="tiny" src={image} />
      <Item.Content>
        <Item.Header>{splitOnUpperCase(type).join(" ")}</Item.Header>
        <Item.Description>{description}</Item.Description>
        <div className="proposal-details">
          <div className="proposal-detail">
            <div className="detail-title">Stake:</div>
            <div className="detail-value">{stake} tJOY</div>
          </div>
          <div className="proposal-detail">
            <div className="detail-title">Cancellation fee:</div>
            <div className="detail-value">{cancellationFee ? `${cancellationFee} tJOY` : "NONE"}</div>
          </div>
          <div className="proposal-detail">
            <div className="detail-title">Grace period:</div>
            <div className="detail-value">
              {gracePeriod ? `${gracePeriod} block${gracePeriod > 1 ? "s" : ""}` : "NONE"}
            </div>
          </div>
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
