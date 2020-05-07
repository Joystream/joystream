import React, { useEffect } from "react";
import { Dropdown, Label, Loader, Message, Icon, DropdownItemProps } from "semantic-ui-react";
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
import { useTransport } from "../runtime";
import { usePromise } from "../utils";
import { Profile } from "@joystream/types/members";
import PromiseComponent from "../Proposal/PromiseComponent";
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

function memberOptionKey(id: number, profile: Profile) {
  return `${id}:${profile.root_account.toString()}`;
}

const NONE_OPTION_VALUE = 'none';

function membersToOptions(members: { id: number, profile: Profile }[]) {
  let noneOption: DropdownItemProps = { key: '- NONE -', text: '- NONE -', value: NONE_OPTION_VALUE };
  return [noneOption].concat(
    members
      .map(({ id, profile }) => ({
        key: profile.handle,
        text: profile.handle,
        value: memberOptionKey(id, profile),
        image: profile.avatar_uri.toString() ? { avatar: true, src: profile.avatar_uri } : null
      }))
  );
}

const SetContentWorkingGroupsLeadForm: React.FunctionComponent<FormInnerProps> = props => {
  const { handleChange, errors, touched, values, setFieldValue } = props;
  const errorLabelsProps = getFormErrorLabelsProps<FormValues>(errors, touched);
  const transport = useTransport();
  const [members, /* error */, loading] = usePromise<{ id: number; profile: Profile }[]>(
    () => transport.membersExceptCouncil(),
    []
  );
  const membersOptions = membersToOptions(members);
  const [currentLead, clError, clLoading] = usePromise<{ id: number; profile: Profile } | null>(
    () => transport.WGLead(),
    null
  );
  useEffect(() => {
    if (currentLead) {
      setFieldValue('workingGroupLead', memberOptionKey(currentLead.id, currentLead.profile));
    }
  }, [currentLead])
  return (
    <PromiseComponent error={clError} loading={clLoading} message="Fetching current lead...">
      <GenericProposalForm
        {...props}
        txMethod="createSetLeadProposal"
        proposalType="SetLead"
        submitParams={[
          props.myMemberId,
          values.title,
          values.rationale,
          "{STAKE}",
          values.workingGroupLead !== NONE_OPTION_VALUE ? values.workingGroupLead.split(":") : undefined
        ]}
      >
        {loading ? (
          <>
            <Loader active inline style={{ marginRight: "5px" }} /> Fetching members...
          </>
        ) : (<>
          <FormField
            error={errorLabelsProps.workingGroupLead}
            label="New Content Working Group Lead"
            help="The member you propose to set as a new Content Working Group Lead"
          >
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
          <Message info active>
            <Message.Content>
              <Icon name="info circle"/>
              Current Content Working Group lead: <b>{ (currentLead && currentLead.profile.handle) || 'NONE' }</b>
            </Message.Content>
          </Message>
        </>)}
      </GenericProposalForm>
    </PromiseComponent>
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
