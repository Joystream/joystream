import React from "react";
import { FormikProps } from "formik";
import { Form, Icon, Button, Divider } from "semantic-ui-react";
import { getFormErrorLabelsProps } from "./errorHandling";
import * as Yup from "yup";

import { withFormContainer } from "./FormContainer";
import "./forms.css";

type SetCouncilParamsProps = {
  handleClear: () => void;
};

interface FormValues {
  title: string;
  rationale: string;
  announcingPeriod: number;
  votingPeriod: number;
  minVotingStake: number;
  revealingPeriod: number;
  minCouncilStake: number;
  newTermDuration: number;
  candidacyLimit: number;
  councilSize: number;
}

function SetCouncilParamsForm(props: SetCouncilParamsProps & FormikProps<FormValues>) {
  const { handleChange, handleSubmit, isSubmitting, errors, touched } = props;
  const errorLabelsProps = getFormErrorLabelsProps<FormValues>(errors, touched);
  return (
    <div className="Forms">
      <Form className="proposal-form" onSubmit={handleSubmit}>
        <Form.Input
          onChange={handleChange}
          label="Title"
          name="title"
          placeholder="Title for your awesome proposal..."
          error={errorLabelsProps.title}
        />
        <Form.TextArea
          onChange={handleChange}
          label="Rationale"
          name="rationale"
          placeholder="This proposal is awesome because..."
          error={errorLabelsProps.rationale}
        />
        <Divider horizontal>Voting </Divider>

        <Form.Group widths="equal" style={{ marginBottom: "8rem" }}>
          <Form.Input
            fluid
            onChange={handleChange}
            label="Announcing Period"
            name="announcingPeriod"
            placeholder="100"
            error={errorLabelsProps.announcingPeriod}
          />
          <Form.Input
            fluid
            onChange={handleChange}
            label="Voting Period"
            name="votingPeriod"
            placeholder="(Currently: x days)"
            error={errorLabelsProps.votingPeriod}
          />
          <Form.Input
            fluid
            onChange={handleChange}
            label="Revealing Period"
            name="revealingPeriod"
            placeholder="100"
            error={errorLabelsProps.revealingPeriod}
          />
          <Form.Input
            fluid
            onChange={handleChange}
            label="Minimum Voting Stake"
            name="minVotingStake"
            placeholder="100"
            error={errorLabelsProps.minVotingStake}
          />
        </Form.Group>
        <Divider horizontal>Council</Divider>
        <Form.Group widths="equal" style={{ marginBottom: "8rem" }}>
          <Form.Input
            fluid
            onChange={handleChange}
            label="Minimum Council Stake"
            name="minCouncilStake"
            placeholder="100"
            error={errorLabelsProps.minCouncilStake}
          />
          <Form.Input
            fluid
            onChange={handleChange}
            label="New Term Duration"
            name="newTermDuration"
            placeholder="100"
            error={errorLabelsProps.newTermDuration}
          />
          <Form.Input
            fluid
            onChange={handleChange}
            label="Council Size"
            name="councilSize"
            placeholder="100"
            error={errorLabelsProps.councilSize}
          />
          <Form.Input
            fluid
            onChange={handleChange}
            label="Candidacy Limit"
            name="candidacyLimit"
            placeholder="5"
            error={errorLabelsProps.candidacyLimit}
          />
        </Form.Group>

        <div className="form-buttons">
          <Button type="submit" color="blue" loading={isSubmitting}>
            <Icon name="paper plane" />
            Submit
          </Button>
          <Button color="grey" icon="times" type="button">
            <Icon name="times" />
            Cancel
          </Button>
        </div>
      </Form>
    </div>
  );
}

type OuterFormProps = {
  initialTitle?: string;
  initialRationale?: string;
  initialAnnouncingPeriod: number;
  initialVotingPeriod: number;
  initialMinVotingStake: number;
  initialRevealingPeriod: number;
  initialMinCouncilStake: number;
  initialNewTermDuration: number;
  initialCandidacyLimit: number;
  initialCouncilSize: number;
} & SetCouncilParamsProps;

export default withFormContainer<OuterFormProps, FormValues>({
  mapPropsToValues: ({
    initialTitle,
    initialRationale,
    initialAnnouncingPeriod,
    initialVotingPeriod,
    initialMinCouncilStake,
    initialMinVotingStake,
    initialRevealingPeriod,
    initialNewTermDuration,
    initialCandidacyLimit,
    initialCouncilSize
  }: OuterFormProps) => ({
    title: initialTitle || "",
    rationale: initialRationale || "",
    announcingPeriod: initialAnnouncingPeriod || "",
    votingPeriod: initialVotingPeriod || "",
    minVotingStake: initialMinVotingStake || "",
    revealingPeriod: initialRevealingPeriod || "",
    minCouncilStake: initialMinCouncilStake || "",
    newTermDuration: initialNewTermDuration || "",
    candidacyLimit: initialCandidacyLimit || "",
    councilSize: initialCouncilSize || ""
  }),
  validationSchema: Yup.object().shape({
    title: Yup.string().required("Title is required!"),
    rationale: Yup.string().required("Rationale is required!"),
    announcingPeriod: Yup.number().required("All fields must be filled!"),
    votingPeriod: Yup.number().required("All fields must be filled!"),
    minVotingStake: Yup.number().required("All fields must be filled!"),
    revealingPeriod: Yup.number().required("All fields must be filled!"),
    minCouncilStake: Yup.number().required("All fields must be filled!"),
    newTermDuration: Yup.number().required("All fields must be filled!"),
    candidacyLimit: Yup.number().required("All fields must be filled!"),
    councilSize: Yup.number().required("All fields must be filled!")
  }),
  handleSubmit: (values, { setSubmitting }) => {
    setTimeout(() => {
      alert(JSON.stringify(values, null, 2));

      setSubmitting(false);
    }, 1000);
  },
  displayName: "SetCouncilParamsForm"
})(SetCouncilParamsForm);
