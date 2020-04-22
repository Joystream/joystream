import React from "react";
import { FormikProps } from "formik";
import { Form, Icon, Button, Divider } from "semantic-ui-react";
import { getFormErrorLabelsProps } from "./errorHandling";
import * as Yup from "yup";

import { withFormContainer } from "./FormContainer";
import "./forms.css";
import LabelWithHelp from "./LabelWithHelp";

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
        <Form.Field error={Boolean(errorLabelsProps.title)}>
          <LabelWithHelp text="Title" help="The title of your proposal" />
          <Form.Input
            onChange={handleChange}
            name="title"
            placeholder="Title for your awesome proposal..."
            error={errorLabelsProps.title}
          />
        </Form.Field>
        <Form.Field error={Boolean(errorLabelsProps.rationale)}>
          <LabelWithHelp text="Rationale" help="The rationale behind your proposal" />
          <Form.TextArea
            onChange={handleChange}
            name="rationale"
            placeholder="This proposal is awesome because..."
            error={errorLabelsProps.rationale}
          />
        </Form.Field>

        <Divider horizontal>Voting </Divider>

        <Form.Group widths="equal" style={{ marginBottom: "8rem" }}>
          <Form.Field error={Boolean(errorLabelsProps.announcingPeriod)}>
            <LabelWithHelp text="Announcing Period" help="Announcing period in days" />
            <Form.Input
              fluid
              onChange={handleChange}
              name="announcingPeriod"
              placeholder="100"
              error={errorLabelsProps.announcingPeriod}
            />
          </Form.Field>
          <Form.Field error={Boolean(errorLabelsProps.votingPeriod)}>
            <LabelWithHelp text="Voting Period" help="Voting period in days" />
            <Form.Input
              fluid
              onChange={handleChange}
              name="votingPeriod"
              placeholder="(Currently: x days)"
              error={errorLabelsProps.votingPeriod}
            />
          </Form.Field>
          <Form.Field error={Boolean(errorLabelsProps.revealingPeriod)}>
            <LabelWithHelp text="Revealing Period" help="Revealing period in days" />
            <Form.Input
              fluid
              onChange={handleChange}
              name="revealingPeriod"
              placeholder="100"
              error={errorLabelsProps.revealingPeriod}
            />
          </Form.Field>
          <Form.Field error={Boolean(errorLabelsProps.minVotingStake)}>
            <LabelWithHelp text="Minimum Voting Stake" help="The minimum voting stake" />
            <Form.Input
              fluid
              onChange={handleChange}
              name="minVotingStake"
              placeholder="100"
              error={errorLabelsProps.minVotingStake}
            />
          </Form.Field>
        </Form.Group>
        <Divider horizontal>Council</Divider>
        <Form.Group widths="equal" style={{ marginBottom: "8rem" }}>
          <Form.Field error={Boolean(errorLabelsProps.minCouncilStake)}>
            <LabelWithHelp text="Minimum Council Stake" help="The minimum council stake" />
            <Form.Input
              fluid
              onChange={handleChange}
              name="minCouncilStake"
              placeholder="100"
              error={errorLabelsProps.minCouncilStake}
            />
          </Form.Field>
          <Form.Field error={Boolean(errorLabelsProps.newTermDuration)}>
            <LabelWithHelp text="New Term Duration" help="Duration of the new term in days" />
            <Form.Input
              fluid
              onChange={handleChange}
              name="newTermDuration"
              placeholder="100"
              error={errorLabelsProps.newTermDuration}
            />
          </Form.Field>
          <Form.Field error={Boolean(errorLabelsProps.councilSize)}>
            <LabelWithHelp text="Council Size" help="The size of the council (number of seats)" />
            <Form.Input
              fluid
              onChange={handleChange}
              name="councilSize"
              placeholder="100"
              error={errorLabelsProps.councilSize}
            />
          </Form.Field>
          <Form.Field error={Boolean(errorLabelsProps.candidacyLimit)}>
            <LabelWithHelp text="Candidacy Limit" help="How many times can a member candidate" />
            <Form.Input
              fluid
              onChange={handleChange}
              name="candidacyLimit"
              placeholder="5"
              error={errorLabelsProps.candidacyLimit}
            />
          </Form.Field>
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
  handleSubmit: (values: FormValues, { setSubmitting }) => {
    setTimeout(() => {
      alert(JSON.stringify(values, null, 2));

      setSubmitting(false);
    }, 1000);
  },
  displayName: "SetCouncilParamsForm"
})(SetCouncilParamsForm);
