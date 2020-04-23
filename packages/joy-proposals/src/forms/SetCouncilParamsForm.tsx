import React from "react";
import { FormikProps } from "formik";
import { getFormErrorLabelsProps } from "./errorHandling";
import { Divider, Form } from "semantic-ui-react";
import * as Yup from "yup";
import {
  GenericProposalForm,
  GenericFormValues,
  genericFormDefaultOptions,
  DefaultOuterFormProps,
  genericFormDefaultValues
} from './GenericProposalForm';
import { InputFormField } from './FormFields';
import { withFormContainer } from "./FormContainer";
import "./forms.css";

type FormValues = GenericFormValues & {
  announcingPeriod: string,
  votingPeriod: string,
  minVotingStake: string,
  revealingPeriod: string,
  minCouncilStake: string,
  newTermDuration: string,
  candidacyLimit: string,
  councilSize: string,
}

const defaultValues: FormValues = {
  ...genericFormDefaultValues,
  announcingPeriod: '',
  votingPeriod: '',
  minVotingStake: '',
  revealingPeriod: '',
  minCouncilStake: '',
  newTermDuration: '',
  candidacyLimit: '',
  councilSize: '',
}

type FromAdditionalProps = {};
type SetCouncilParamsFormProps = FormikProps<FormValues> & FromAdditionalProps;

const SetCouncilParamsForm: React.FunctionComponent<SetCouncilParamsFormProps> = props => {
  const { handleChange, errors, touched, values } = props;
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

type OuterFormProps = DefaultOuterFormProps<FromAdditionalProps, FormValues>;

export default withFormContainer<OuterFormProps, FormValues>({
  mapPropsToValues: (props:OuterFormProps) => ({
    ...defaultValues,
    ...(props.initialData || {})
  }),
  validationSchema: Yup.object().shape({
    ...genericFormDefaultOptions.validationSchema,
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
