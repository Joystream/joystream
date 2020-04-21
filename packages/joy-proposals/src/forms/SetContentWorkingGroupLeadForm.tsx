import React from "react";
import { FormikProps } from "formik";
import { Dropdown, Label } from "semantic-ui-react";
import { getFormErrorLabelsProps } from "./errorHandling";
import * as Yup from "yup";
import {
  GenericProposalForm,
  GenericFormValues,
  genericFormDefaultOptions,
  DefaultOuterFormProps,
  genericFormDefaultValues
} from './GenericProposalForm';
import { FormField } from './FormFields';

import { withFormContainer } from "./FormContainer";
import "./forms.css";

type FormValues = GenericFormValues & {
  workingGroupLead: any;
}

const defaultValues: FormValues = {
  ...genericFormDefaultValues,
  workingGroupLead: ''
}

type FormAdditionalProps = { members: any[] };
type SetContentWorkingGroupsLeadFormProps = FormikProps<FormValues> & FormAdditionalProps;

const SetContentWorkingGroupsLeadForm: React.FunctionComponent<SetContentWorkingGroupsLeadFormProps> = props => {
  const { handleChange, members, errors, touched, values } = props;
  const errorLabelsProps = getFormErrorLabelsProps<FormValues>(errors, touched);
  return (
    <GenericProposalForm {...props}>
      <FormField
        error={errorLabelsProps.workingGroupLead}
        label="New Content Working Group Lead"
        help="The member you propose to set as a new Content Working Group Lead">
        <Dropdown
          clearable
          name="workingGroupLead"
          placeholder="Select a member"
          fluid
          selection
          options={members}
          onChange={handleChange}
          value={values.workingGroupLead}
        />
        {errorLabelsProps.workingGroupLead && <Label {...errorLabelsProps.workingGroupLead} prompt />}
      </FormField>
    </GenericProposalForm>
  );
}

type OuterFormProps = DefaultOuterFormProps<FormAdditionalProps, FormValues>;

export default withFormContainer<OuterFormProps, FormValues>({
  mapPropsToValues: (props:OuterFormProps) => ({
    ...defaultValues,
    ...(props.initialData || {})
  }),
  validationSchema: Yup.object().shape({
    ...genericFormDefaultOptions.validationSchema,
    workingGroupLead: Yup.string().required("Select a proposed lead!")
  }),
  handleSubmit: genericFormDefaultOptions.handleSubmit,
  displayName: "SetContentWorkingGroupLeadForm"
})(SetContentWorkingGroupsLeadForm);
