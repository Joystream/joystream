import React, { useEffect, useState } from 'react';
import { Dropdown, Label, Loader, Message, Icon, DropdownItemProps, DropdownOnSearchChangeData, DropdownProps } from 'semantic-ui-react';
import { getFormErrorLabelsProps } from './errorHandling';
import * as Yup from 'yup';
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
import Validation from '../validationSchema';
import { FormField } from './FormFields';
import { withFormContainer } from './FormContainer';
import { useTransport, usePromise } from '@polkadot/joy-utils/react/hooks';
import { Membership } from '@joystream/types/members';
import { PromiseComponent } from '@polkadot/joy-utils/react/components';
import _ from 'lodash';
import './forms.css';

export type FormValues = GenericFormValues & {
  workingGroupLead: any;
};

const defaultValues: FormValues = {
  ...genericFormDefaultValues,
  workingGroupLead: ''
};

type FormAdditionalProps = {}; // Aditional props coming all the way from export comonent into the inner form.
type ExportComponentProps = ProposalFormExportProps<FormAdditionalProps, FormValues>;
type FormContainerProps = ProposalFormContainerProps<ExportComponentProps>;
type FormInnerProps = ProposalFormInnerProps<FormContainerProps, FormValues>;

function memberOptionKey (id: number, profile: Membership) {
  return `${id}:${profile.root_account.toString()}`;
}

const MEMBERS_QUERY_MIN_LENGTH = 4;
const MEMBERS_NONE_OPTION: DropdownItemProps = {
  key: '- NONE -',
  text: '- NONE -',
  value: 'none'
};

function membersToOptions (members: { id: number; profile: Membership }[]) {
  return [MEMBERS_NONE_OPTION].concat(
    members
      .map(({ id, profile }) => ({
        key: profile.handle,
        text: `${profile.handle} (id:${id})`,
        value: memberOptionKey(id, profile),
        image: profile.avatar_uri.toString() ? { avatar: true, src: profile.avatar_uri } : null
      }))
  );
}

function filterMembers (options: DropdownItemProps[], query: string) {
  if (query.length < MEMBERS_QUERY_MIN_LENGTH) {
    return [MEMBERS_NONE_OPTION];
  }
  const regexp = new RegExp(_.escapeRegExp(query));
  return options.filter((opt) => regexp.test((opt.text || '').toString()));
}

type MemberWithId = { id: number; profile: Membership };

const SetContentWorkingGroupsLeadForm: React.FunctionComponent<FormInnerProps> = props => {
  const { handleChange, errors, touched, values } = props;
  const errorLabelsProps = getFormErrorLabelsProps<FormValues>(errors, touched);
  // State
  const [membersOptions, setMembersOptions] = useState([] as DropdownItemProps[]);
  const [filteredOptions, setFilteredOptions] = useState([] as DropdownItemProps[]);
  const [membersSearchQuery, setMembersSearchQuery] = useState('');
  // Transport
  const transport = useTransport();
  const [members, /* error */, loading] = usePromise<MemberWithId[]>(
    () => transport.council.membersExceptCouncil(),
    []
  );
  const [currentLead, clError, clLoading] = usePromise<MemberWithId | null>(
    () => transport.contentWorkingGroup.currentLead(),
    null
  );
  // Generate members options array on load
  useEffect(() => {
    if (members.length) {
      setMembersOptions(membersToOptions(members));
    }
  }, [members]);
  // Filter options on search query change (we "pulled-out" this logic here to avoid lags)
  useEffect(() => {
    setFilteredOptions(filterMembers(membersOptions, membersSearchQuery));
  }, [membersSearchQuery]);

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
          '{STAKE}',
          values.workingGroupLead !== MEMBERS_NONE_OPTION.value ? values.workingGroupLead.split(':') : undefined
        ]}
      >
        {loading ? (
          <>
            <Loader active inline style={{ marginRight: '5px' }} /> Fetching members...
          </>
        ) : (<>
          <FormField
            error={errorLabelsProps.workingGroupLead}
            label="New Content Working Group Lead"
            help={
              'The member you propose to set as a new Content Working Group Lead. ' +
              'Start typing handle or use "id:[ID]" query. ' +
              'Current council members are not allowed to be selected and are excluded from the list.'
            }
          >
            {
              (!values.workingGroupLead || membersSearchQuery.length > 0) &&
              (MEMBERS_QUERY_MIN_LENGTH - membersSearchQuery.length) > 0 && (
                <Label>
                  Type at least { MEMBERS_QUERY_MIN_LENGTH - membersSearchQuery.length } more characters
                </Label>
              )
            }
            <Dropdown
              clearable
              // Here we just ignore search query and return all options, since we pulled-out this logic
              // to our component to avoid lags
              search={ (options: DropdownItemProps[], query: string) => options }
              // On search change we update it in our state
              onSearchChange={ (e: React.SyntheticEvent, data: DropdownOnSearchChangeData) => {
                setMembersSearchQuery(data.searchQuery);
              } }
              name="workingGroupLead"
              placeholder={ 'Start typing member handle or "id:[ID]" query...' }
              fluid
              selection
              options={filteredOptions}
              onChange={
                (e: React.ChangeEvent<any>, data: DropdownProps) => {
                  // Fix TypeScript issue
                  const originalHandler = handleChange as (e: React.ChangeEvent<any>, data: DropdownProps) => void;
                  originalHandler(e, data);
                  if (!data.value) {
                    setMembersSearchQuery('');
                  }
                }
              }
              value={values.workingGroupLead}
            />
            {errorLabelsProps.workingGroupLead && <Label {...errorLabelsProps.workingGroupLead} prompt />}
          </FormField>
          <Message info active={1}>
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
    ...Validation.SetLead()
  }),
  handleSubmit: genericFormDefaultOptions.handleSubmit,
  displayName: 'SetContentWorkingGroupLeadForm'
})(SetContentWorkingGroupsLeadForm);

export default withProposalFormData<FormContainerProps, ExportComponentProps>(FormContainer);
