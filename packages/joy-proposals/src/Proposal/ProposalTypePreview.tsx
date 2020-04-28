import React from "react";
import { Item, Icon, Button } from "semantic-ui-react";
import { Category } from "./ChooseProposalType";
import { ProposalType } from "../runtime";

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
};

export default function ProposalTypePreview(props: ProposalTypePreviewProps) {
  const {
    typeInfo: { type, image, description, stake, cancellationFee, gracePeriod }
  } = props;
  return (
    <Item className="ProposalType">
      <Item.Image size="tiny" src={image} />
      <Item.Content>
        <Item.Header>{type}</Item.Header>
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
              {gracePeriod ? `${gracePeriod} day${gracePeriod > 1 ? "s" : ""}` : "NONE"}
            </div>
          </div>
        </div>
      </Item.Content>
      <div className="actions">
        <Button primary className="btn-create" size="medium">
          Create
          <Icon name="chevron right" />
        </Button>
      </div>
    </Item>
  );
}
