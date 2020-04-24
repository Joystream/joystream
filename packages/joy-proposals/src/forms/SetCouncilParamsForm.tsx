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
} from "./GenericProposalForm";
import { InputFormField } from "./FormFields";
import { withFormContainer } from "./FormContainer";
import "./forms.css";

type FormValues = GenericFormValues & {
  announcingPeriod: string;
  votingPeriod: string;
  minVotingStake: string;
  revealingPeriod: string;
  minCouncilStake: string;
  newTermDuration: string;
  candidacyLimit: string;
  councilSize: string;
};

const defaultValues: FormValues = {
  ...genericFormDefaultValues,
  announcingPeriod: "",
  votingPeriod: "",
  minVotingStake: "",
  revealingPeriod: "",
  minCouncilStake: "",
  newTermDuration: "",
  candidacyLimit: "",
  councilSize: ""
};

type FromAdditionalProps = {};
type SetCouncilParamsFormProps = FormikProps<FormValues> & FromAdditionalProps;

const SetCouncilParamsForm: React.FunctionComponent<SetCouncilParamsFormProps> = props => {
  const { handleChange, errors, touched, values } = props;
  const errorLabelsProps = getFormErrorLabelsProps<FormValues>(errors, touched);
  return (
    <GenericProposalForm {...props}>
      <Divider horizontal>Voting </Divider>
      <Form.Group widths="equal" style={{ marginBottom: "8rem" }}>
        <InputFormField
          label="Announcing Period"
          help="Announcing period in days"
          onChange={handleChange}
          name="announcingPeriod"
          placeholder="100"
          error={errorLabelsProps.announcingPeriod}
          value={values.announcingPeriod}
        />
        <InputFormField
          label="Voting Period"
          help="Voting period in days"
          onChange={handleChange}
          name="votingPeriod"
          placeholder="(Currently: x days)"
          error={errorLabelsProps.votingPeriod}
          value={values.votingPeriod}
        />
        <InputFormField
          label="Revealing Period"
          help="Revealing period in days"
          fluid
          onChange={handleChange}
          name="revealingPeriod"
          placeholder="100"
          error={errorLabelsProps.revealingPeriod}
          value={values.revealingPeriod}
        />
        <InputFormField
          label="Minimum Voting Stake"
          help="The minimum voting stake"
          fluid
          onChange={handleChange}
          name="minVotingStake"
          placeholder="100"
          error={errorLabelsProps.minVotingStake}
          value={values.minVotingStake}
        />
      </Form.Group>
      <Divider horizontal>Council</Divider>
      <Form.Group widths="equal" style={{ marginBottom: "8rem" }}>
        <InputFormField
          label="Minimum Council Stake"
          help="The minimum council stake"
          fluid
          onChange={handleChange}
          name="minCouncilStake"
          placeholder="100"
          error={errorLabelsProps.minCouncilStake}
          value={values.minCouncilStake}
        />
        <InputFormField
          label="New Term Duration"
          help="Duration of the new term in days"
          fluid
          onChange={handleChange}
          name="newTermDuration"
          placeholder="100"
          error={errorLabelsProps.newTermDuration}
          value={values.newTermDuration}
        />
        <InputFormField
          label="Council Size"
          help="The size of the council (number of seats)"
          fluid
          onChange={handleChange}
          name="councilSize"
          placeholder="100"
          error={errorLabelsProps.councilSize}
          value={values.councilSize}
        />
        <InputFormField
          label="Candidacy Limit"
          help="How many times can a member candidate"
          fluid
          onChange={handleChange}
          name="candidacyLimit"
          placeholder="5"
          error={errorLabelsProps.candidacyLimit}
          value={values.candidacyLimit}
        />
      </Form.Group>
    </GenericProposalForm>
  );
};

type OuterFormProps = DefaultOuterFormProps<FromAdditionalProps, FormValues>;

export default withFormContainer<OuterFormProps, FormValues>({
  mapPropsToValues: (props: OuterFormProps) => ({
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
  handleSubmit: genericFormDefaultOptions.handleSubmit,
  displayName: "SetCouncilParamsForm"
})(SetCouncilParamsForm);
