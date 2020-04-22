import React from "react";
import "../index.css";

import MockProposalPreviewList from "./data/ProposalPreviewList.mock";
import { ProposalPreviewList } from "../Proposal";

export default {
    title: "Proposals | Preview List",
};

export const Default = () => <ProposalPreviewList proposals={MockProposalPreviewList} />;