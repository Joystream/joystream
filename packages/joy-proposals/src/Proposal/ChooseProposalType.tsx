import React, { useState } from "react";
import ProposalTypePreview from "./ProposalTypePreview";
import { Item, Dropdown } from "semantic-ui-react";

import { useTransport } from "../runtime";
import { usePromise } from "../utils";
import Error from "./Error";
import Loading from "./Loading";
import "./ChooseProposalType.css";
import { RouteComponentProps } from "react-router-dom";

export const Categories = {
  storage: "Storage",
  council: "Council",
  validators: "Validators",
  cwg: "Content Working Group",
  other: "Other"
} as const;

export type Category = typeof Categories[keyof typeof Categories];

export default function ChooseProposalType(props: RouteComponentProps) {
  const transport = useTransport();

  const [proposalTypes, error, loading] = usePromise(() => transport.proposalsTypesParameters(), []);
  const [category, setCategory] = useState("");

  if (loading && !error) {
    return <Loading text="Fetching proposals..." />;
  } else if (error || proposalTypes == null) {
    return <Error error={error} />;
  }

  console.log({ proposalTypes, loading, error });
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
