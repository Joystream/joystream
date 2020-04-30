import React from "react";
import { Dropdown, Label } from "semantic-ui-react";
import { getFormErrorLabelsProps } from "./errorHandling";
import * as Yup from "yup";
import {
  GenericProposalForm,
  GenericFormValues,
  genericFormDefaultOptions,
  genericFormDefaultValues,
  withProposalFormData,
  ProposalFormExportProps,
  ProposalFormContainerProps,
  ProposalFormInnerProps
} from "./GenericProposalForm";
import Validation from "../validationSchema";
import { FormField } from "./FormFields";
import { withFormContainer } from "./FormContainer";
import "./forms.css";

type FormValues = GenericFormValues & {
  workingGroupLead: any;
};

const defaultValues: FormValues = {
  ...genericFormDefaultValues,
  workingGroupLead: ""
};

type FormAdditionalProps = {}; // Aditional props coming all the way from export comonent into the inner form.
type ExportComponentProps = ProposalFormExportProps<FormAdditionalProps, FormValues>;
type FormContainerProps = ProposalFormContainerProps<ExportComponentProps>;
type FormInnerProps = ProposalFormInnerProps<FormContainerProps, FormValues>;

const SetContentWorkingGroupsLeadForm: React.FunctionComponent<FormInnerProps> = props => {
  const { handleChange, errors, touched, values } = props;
  const errorLabelsProps = getFormErrorLabelsProps<FormValues>(errors, touched);
  const membersOptions = [
    {
      key: "Alice",
      text: "Alice",
      value: "207:5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY",
      image: { avatar: true, src: "https://react.semantic-ui.com/images/avatar/small/jenny.jpg" }
    }
  ]; // TODO: Fetch real members!

  return (
    <GenericProposalForm
      {...props}
      txMethod="createSetLeadProposal"
      requiredStakePercent={0.25}
      submitParams={[props.myMemberId, values.title, values.rationale, "{STAKE}", values.workingGroupLead.split(":")]}
    >
      <FormField
        error={errorLabelsProps.workingGroupLead}
        label="New Content Working Group Lead"
        help="The member you propose to set as a new Content Working Group Lead"
      >
        <Dropdown
          clearable
          name="workingGroupLead"
          placeholder="Select a member"
          fluid
          selection
          options={membersOptions}
          onChange={handleChange}
          value={values.workingGroupLead}
        />
        {errorLabelsProps.workingGroupLead && <Label {...errorLabelsProps.workingGroupLead} prompt />}
      </FormField>
    </GenericProposalForm>
  );
};

const FormContainer = withFormContainer<FormContainerProps, FormValues>({
  mapPropsToValues: (props: FormContainerProps) => ({
    ...defaultValues,
    ...(props.initialData || {})
  }),
  validationSchema: Yup.object().shape({
    ...genericFormDefaultOptions.validationSchema,
    workingGroupLead: Validation.SetLead.workingGroupLead
  }),
  handleSubmit: genericFormDefaultOptions.handleSubmit,
  displayName: "SetContentWorkingGroupLeadForm"
})(SetContentWorkingGroupsLeadForm);

export default withProposalFormData<FormContainerProps, ExportComponentProps>(FormContainer);
