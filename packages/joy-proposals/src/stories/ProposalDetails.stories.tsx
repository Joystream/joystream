import React from "react";
import "../index.css";

import MockProposalDetails from "./data/MockProposalDetails";
import ProposalDetails from "../ProposalDetails";

export default {
  title: "ProposalsDetails | Types",
  component: ProposalDetails
};

export const ProposalTypes = () => <ProposalDetails {...MockProposalDetails} />;
