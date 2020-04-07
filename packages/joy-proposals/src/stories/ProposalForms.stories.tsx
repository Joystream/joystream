import React from "react";
import "../index.css";
import { EditForm } from "../forms/GenericProposalForm";
import {
  ProposalId,
  ProposalType,
  ProposalFormValues,
  ProposalGenericProp,
  ProposalValidationConstraints,
} from "../forms/ProposalTypes";

export default {
  title: "Proposals | Forms",
};

const MockGenericProposal = {
  title: "Please send me some tokens for coffee",
  description: "I am a good guy and deserve this reward.",
};

const MockProposalConstraints = {
  title: { min: 1, max: 50 },
  description: { min: 1, max: 50 },
};

export const GenericForm = () => <EditForm entity={MockGenericProposal} constraints={MockProposalConstraints} />;
