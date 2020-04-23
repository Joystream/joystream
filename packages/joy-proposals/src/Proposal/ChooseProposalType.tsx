import React, { useState } from "react";
import ProposalTypePreview, { ProposalTypeInfo } from "./ProposalTypePreview";
import { Item, Dropdown } from "semantic-ui-react";

import "./ChooseProposalType.css";

export const Categories = {
  storage: "Storage",
  council: "Council",
  validators: "Validators",
  cwg: "Content Working Group",
  other: "Other"
} as const;

export type Category = typeof Categories[keyof typeof Categories];

type ChooseProposalTypeProps = {
  proposalTypes: ProposalTypeInfo[];
};

export default function ProposalPreview(props: ChooseProposalTypeProps) {
  const { proposalTypes } = props;
  const [category, setCategory] = useState("");
  return (
    <div className="ChooseProposalType">
      <div className="filters">
        <Dropdown
          placeholder="Category"
          options={Object.values(Categories).map(category => ({ value: category, text: category }))}
          value={category}
          onChange={(e, data) => setCategory((data.value || "").toString())}
          clearable
          selection
        />
      </div>
      <Item.Group>
        {proposalTypes
          .filter(typeInfo => !category || typeInfo.category === category)
          .map((typeInfo, idx) => (
            <ProposalTypePreview key={`${typeInfo} - ${idx}`} typeInfo={typeInfo} />
          ))}
      </Item.Group>
    </div>
  );
}
