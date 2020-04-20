import React from "react";
import { FormikProps } from "formik";
import { Form, Dropdown, Label } from "semantic-ui-react";
import { getFormErrorLabelsProps } from "./errorHandling";
import * as Yup from "yup";
import LabelWithHelp from './LabelWithHelp';
import { GenericProposalForm, GenericFormValues, genericFormDefaultOptions } from './GenericProposalForm';

import { withFormContainer } from "./FormContainer";
import "./forms.css";

type FormValues = GenericFormValues & {
  workingGroupLead: any;
}

type SetContentWorkingGroupsLeadFormProps = FormikProps<FormValues> & {
  members: any[];
};

const SetContentWorkingGroupsLeadForm: React.FunctionComponent<SetContentWorkingGroupsLeadFormProps> = props => {
  const { handleChange, members, errors, isSubmitting, touched, handleSubmit } = props;
  const passProps = { handleChange, errors, isSubmitting, touched, handleSubmit };
  const errorLabelsProps = getFormErrorLabelsProps<FormValues>(errors, touched);
  return (
    <GenericProposalForm {...passProps}>
      <Form.Field error={Boolean(errorLabelsProps.workingGroupLead)}>
        <LabelWithHelp
          text="New Content Working Group Lead"
          help="The member you propose to set as a new Content Working Group Lead"/>
        <Dropdown
          clearable
          name="workingGroupLead"
          placeholder="Select a member"
          fluid
          selection
          options={members}
          onChange={handleChange}
        />
        {errorLabelsProps.workingGroupLead && <Label {...errorLabelsProps.workingGroupLead} prompt />}
      </Form.Field>
    </GenericProposalForm>
  );
}

type OuterFormProps = {
  initialTitle?: FormValues["title"],
  initialRationale?: FormValues["rationale"],
  initialWorkingGroupLead?: FormValues["workingGroupLead"]
} & SetContentWorkingGroupsLeadFormProps;

export default withFormContainer<OuterFormProps, FormValues>({
  mapPropsToValues: (props: OuterFormProps) => ({
    ...(genericFormDefaultOptions.mapPropsToValues || (() => ({})))(props),
    workingGroupLead: ""
  }),
  validationSchema: Yup.object().shape({
    ...genericFormDefaultOptions.validationSchema,
    workingGroupLead: Yup.string().required("Select a proposed lead!")
  }),
  handleSubmit: genericFormDefaultOptions.handleSubmit,
  displayName: "SetContentWorkingGroupLeadForm"
})(SetContentWorkingGroupsLeadForm);
