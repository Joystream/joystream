import React from "react";
import "../index.css";

import MockProposalTypesInfo from "./data/ProposalTypesInfo.mock";
import { ChooseProposalType } from "../Proposal";

export default {
    title: "Proposals | Proposal Types",
};

export const Default = () => <ChooseProposalType proposalTypes={MockProposalTypesInfo} />;
