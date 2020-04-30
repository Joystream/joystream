import React from "react";
import { Dropdown, Label, Loader } from "semantic-ui-react";
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
} from './GenericProposalForm';
import { FormField } from './FormFields';
import { withFormContainer } from "./FormContainer";
import { useTransport } from "../runtime";
import { usePromise } from "../utils";
import { Profile } from "@joystream/types/members";
import "./forms.css";

type FormValues = GenericFormValues & {
  workingGroupLead: any;
}

const defaultValues: FormValues = {
  ...genericFormDefaultValues,
  workingGroupLead: ''
}

type FormAdditionalProps = {}; // Aditional props coming all the way from export comonent into the inner form.
type ExportComponentProps = ProposalFormExportProps<FormAdditionalProps, FormValues>;
type FormContainerProps = ProposalFormContainerProps<ExportComponentProps>;
type FormInnerProps = ProposalFormInnerProps<FormContainerProps, FormValues>;

const SetContentWorkingGroupsLeadForm: React.FunctionComponent<FormInnerProps> = props => {
  const { handleChange, errors, touched, values } = props;
  const errorLabelsProps = getFormErrorLabelsProps<FormValues>(errors, touched);
  const transport = useTransport();
  const [ members, /* error */, loading ] = usePromise<{ id: number, profile: Profile }[]>(() => transport.membersExceptCouncil(), []);
  const membersOptions = members.map(({ id, profile }) => ({
    key: profile.handle,
    text: profile.handle,
    value: `${id}:${ profile.root_account.toString() }`,
    image: profile.avatar_uri.toString() ? { avatar: true, src: profile.avatar_uri }: null,
  }));
  return (
    <GenericProposalForm
      {...props}
      txMethod="createSetLeadProposal"
      requiredStakePercent={0.25}
      submitParams={[
        props.myMemberId,
        values.title,
        values.rationale,
        '{STAKE}',
        values.workingGroupLead.split(':')
      ]}
    >
      { loading ?
        <><Loader active inline style={ { marginRight: '5px' } }/> Fetching members...</>
        : (
          <FormField
            error={errorLabelsProps.workingGroupLead}
            label="New Content Working Group Lead"
            help="The member you propose to set as a new Content Working Group Lead">
            <Dropdown
              clearable
              search
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
        ) }
    </GenericProposalForm>
  );
}

const FormContainer = withFormContainer<FormContainerProps, FormValues>({
  mapPropsToValues: (props:FormContainerProps) => ({
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

export default withProposalFormData<FormContainerProps, ExportComponentProps>(FormContainer);
