import React from "react";
import "../index.css";

import { proposalDetails as mockedDetails } from "../__mocks__";
import ProposalDetails from "../ProposalDetails";

export default {
  title: "Proposals | Details"
};

export const HasToVote = () => <ProposalDetails {...mockedDetails} />;

export const VotedApproved = () => <ProposalDetails {...mockedDetails} vote={{ hasVoted: true, value: "Approve" }} />;

export const VotedAbstain = () => <ProposalDetails {...mockedDetails} vote={{ hasVoted: true, value: "Abstain" }} />;

export const VotedReject = () => <ProposalDetails {...mockedDetails} vote={{ hasVoted: true, value: "Reject" }} />;

export const VotedSlash = () => <ProposalDetails {...mockedDetails} vote={{ hasVoted: true, value: "Slash" }} />;
