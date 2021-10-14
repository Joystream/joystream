import React, { useEffect, useState, useRef } from 'react';
import { FormikProps } from 'formik';
import { Form, Icon, Button, Message } from 'semantic-ui-react';
import { getFormErrorLabelsProps } from './errorHandling';
import { InputFormField, TextareaFormField } from './FormFields';
import TxButton from '@polkadot/joy-utils/react/components/TxButton';
import { SubmittableResult } from '@polkadot/api';
import { TxFailedCallback, TxCallback } from '@polkadot/react-components/Status/types';
import { MyAccountProps } from '@polkadot/joy-utils/react/hocs/accounts';
import { withOnlyMembers } from '@polkadot/joy-utils/react/hocs/guards';
import { withMulti } from '@polkadot/react-api/hoc';
import { withCalls } from '@polkadot/react-api';
import { CallProps } from '@polkadot/react-api/types';
import { Balance, Event } from '@polkadot/types/interfaces';
import { RouteComponentProps } from 'react-router';
import { ProposalType } from '@polkadot/joy-utils/types/proposals';
import proposalsConsts from '@polkadot/joy-utils/consts/proposals';
import { formatBalance } from '@polkadot/util';
import { ProposalId } from '@joystream/types/proposals';
import styled from 'styled-components';

// Generic form values
export type GenericFormValues = {
  title: string;
  rationale: string;
};

export const genericFormDefaultValues: GenericFormValues = {
  title: '',
  rationale: ''
};

// Helper generic types for defining form's Export, Container and Inner component prop types
export type ProposalFormExportProps<AdditionalPropsT, FormValuesT> = RouteComponentProps &

AdditionalPropsT & {
  initialData?: Partial<FormValuesT>;
};
export type ProposalFormContainerProps<ExportPropsT> = ExportPropsT &
MyAccountProps &
CallProps & {
  balances_totalIssuance?: Balance;
};

export type ProposalFormInnerProps<ContainerPropsT, FormValuesT> = ContainerPropsT & FormikProps<FormValuesT>;

// Types only used in this file
type GenericProposalFormAdditionalProps = {
  txMethod: string;
  submitParams?: any[];
  proposalType: ProposalType;
  disabled?: boolean;
};

type GenericFormContainerProps = ProposalFormContainerProps<

ProposalFormExportProps<GenericProposalFormAdditionalProps, GenericFormValues>

>;
type GenericFormInnerProps = ProposalFormInnerProps<GenericFormContainerProps, GenericFormValues>;

const StyledGenericProposalForm = styled.div`
  .proposal-form {
    margin: 0 auto;
  }

  .ui.form.proposal-form {
    & label {
      font-size: 1rem;
    }

    & input[name="tokens"] {
      max-width: 16rem;
    }
  }

  .form-buttons {
    display: flex;
  }

  .ui.dropdown .ui.avatar.image {
    width: 2em !important;
  }
`;

// Generic proposal form with basic structure, "Title" and "Rationale" fields
// Other fields can be passed as children
export const GenericProposalForm: React.FunctionComponent<GenericFormInnerProps> = (props) => {
  const {
    myMemberId,
    handleChange,
    handleSubmit,
    errors,
    isSubmitting,
    isValidating,
    isValid,
    touched,
    submitForm,
    children,
    handleReset,
    values,
    txMethod,
    submitParams,
    setSubmitting,
    history,
    proposalType,
    disabled = false
  } = props;
  const errorLabelsProps = getFormErrorLabelsProps<GenericFormValues>(errors, touched);
  const [afterSubmit, setAfterSubmit] = useState(null as (() => () => void) | null);
  const formContainerRef = useRef<HTMLDivElement>(null);

  // Scroll to top on load
  useEffect(() => { window.scrollTo(0, 0); }, []);

  // After-submit effect
  // With current version of Formik, there seems to be no other viable way to handle this (ie. for sendTx)
  useEffect(() => {
    if (!isValidating && afterSubmit) {
      if (isValid) {
        afterSubmit();
      }

      setAfterSubmit(null);
      setSubmitting(false);
    }
    // setSubmitting shouldn't change, so we don't specify it as dependency to avoid complications
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isValidating, isValid, afterSubmit]);

  // Focus first error field when isValidating changes to false (which happens after form is validated)
  // (operates directly on DOM)
  useEffect(() => {
    if (!isValidating && formContainerRef.current !== null) {
      const [errorField] = formContainerRef.current.getElementsByClassName('error field');

      if (errorField) {
        errorField.scrollIntoView({ behavior: 'smooth' });
        const [errorInput] = errorField.querySelectorAll('input,textarea');

        if (errorInput) {
          (errorInput as (HTMLInputElement | HTMLTextAreaElement)).focus();
        }
      }
    }
  }, [isValidating]);

  // Replaces standard submit handler (in order to work with TxButton)
  const onTxButtonClick = (sendTx: () => void) => {
    submitForm();
    setAfterSubmit(() => sendTx);
  };

  const onTxFailed: TxFailedCallback = (txResult: SubmittableResult | Error | null) => {
    setSubmitting(false);
  };

  const onTxSuccess: TxCallback = (txResult: SubmittableResult) => {
    if (!history) return;
    // Determine proposal id
    let createdProposalId: number | null = null;

    for (const e of txResult.events) {
      const event = e.get('event') as Event | undefined;

      if (event !== undefined && event.method === 'ProposalCreated') {
        createdProposalId = (event.data[1] as ProposalId).toNumber();
        break;
      }
    }

    setSubmitting(false);

    if (createdProposalId !== null) {
      history.push(`/proposals/${createdProposalId}`);
    }
  };

  const requiredStake = proposalType && proposalsConsts[proposalType].stake;

  return (
    <StyledGenericProposalForm ref={formContainerRef}>
      <Form
        className='proposal-form'
        onSubmit={txMethod
          ? () => { /* Do nothing. Tx button uses custom submit handler - "onTxButtonClick" */ }
          : handleSubmit
        }>
        <InputFormField
          label='Title'
          help='The title of your proposal'
          onChange={handleChange}
          name='title'
          placeholder='Title for your awesome proposal...'
          error={errorLabelsProps.title}
          value={values.title}
        />
        <TextareaFormField
          label='Rationale'
          help='The rationale behind your proposal'
          onChange={handleChange}
          name='rationale'
          placeholder='This proposal is awesome because...'
          error={errorLabelsProps.rationale}
          value={values.rationale}
        />
        {children}
        <Message warning visible>
          <Message.Content>
            <Icon name='warning circle' />
            Required stake: <b>{ formatBalance(requiredStake) }</b>
          </Message.Content>
        </Message>
        <div className='form-buttons'>
          {txMethod ? (
            <TxButton
              type='button' // Tx button uses custom submit handler - "onTxButtonClick"
              label='Submit proposal'
              isDisabled={disabled || isSubmitting}
              params={[
                myMemberId,
                values.title,
                values.rationale,
                requiredStake,
                // submitParams is any[], but it's not much of an issue (params can vary a lot)
                // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
                ...(submitParams || [])
              ]}
              tx={`proposalsCodex.${txMethod}`}
              txFailedCb={onTxFailed}
              txSuccessCb={onTxSuccess}
              onClick={onTxButtonClick} // This replaces standard submit
            />
          ) : (
            <Button type='submit' size='large' color='blue' loading={isSubmitting}>
              <Icon name='paper plane' />
              Submit
            </Button>
          )}

          <Button type='button' size='large' onClick={handleReset}>
            Reset form
          </Button>
        </div>
      </Form>
    </StyledGenericProposalForm>
  );
};

// Helper that provides additional wrappers for proposal forms

export function withProposalFormData<ContainerPropsT, ExportPropsT> (
  FormContainerComponent: React.ComponentType<ContainerPropsT>
): React.ComponentType<ExportPropsT> {
  return withMulti(FormContainerComponent, withOnlyMembers, withCalls('query.balances.totalIssuance'));
}
