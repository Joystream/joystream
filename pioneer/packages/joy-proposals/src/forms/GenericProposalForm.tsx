import React from "react";
import { FormikProps, WithFormikConfig } from "formik";
import { Form, Icon, Button, Message } from "semantic-ui-react";
import { getFormErrorLabelsProps } from "./errorHandling";
import Validation from "../validationSchema";
import { InputFormField, TextareaFormField } from "./FormFields";
import TxButton from "@polkadot/joy-utils/TxButton";
import { SubmittableResult } from "@polkadot/api";
import { TxFailedCallback, TxCallback } from "@polkadot/react-components/Status/types";
import { MyAccountProps, withOnlyMembers } from "@polkadot/joy-utils/MyAccount";
import { withMulti } from "@polkadot/react-api/with";
import { withCalls } from "@polkadot/react-api";
import { CallProps } from "@polkadot/react-api/types";
import { Balance, Event } from "@polkadot/types/interfaces";
import { RouteComponentProps } from "react-router";
import { ProposalType } from "../runtime";
import { calculateStake } from "../utils";
import { formatBalance } from "@polkadot/util"
import "./forms.css";
import { ProposalId } from "@joystream/types/lib/proposals";


// Generic form values
export type GenericFormValues = {
  title: string;
  rationale: string;
};

export const genericFormDefaultValues: GenericFormValues = {
  title: "",
  rationale: ""
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
  txMethod?: string;
  submitParams?: any[];
  proposalType?: ProposalType;
};

type GenericFormContainerProps = ProposalFormContainerProps<

  ProposalFormExportProps<GenericProposalFormAdditionalProps, GenericFormValues>

>;
type GenericFormInnerProps = ProposalFormInnerProps<GenericFormContainerProps, GenericFormValues>;
type GenericFormDefaultOptions = WithFormikConfig<GenericFormContainerProps, GenericFormValues>;

// Default "withFormik" options that can be extended in specific forms
export const genericFormDefaultOptions: GenericFormDefaultOptions = {
  mapPropsToValues: (props: GenericFormContainerProps) => ({
    ...genericFormDefaultValues,
    ...(props.initialData || {})
  }),
  validationSchema: {

    title: Validation.All.title,
    rationale: Validation.All.rationale

  },
  handleSubmit: (values, { setSubmitting, resetForm }) => {
    // This is handled via TxButton
  }
};

// Generic proposal form with basic structure, "Title" and "Rationale" fields
// Other fields can be passed as children
export const GenericProposalForm: React.FunctionComponent<GenericFormInnerProps> = props => {
  const {
    handleChange,
    errors,
    isSubmitting,
    touched,
    handleSubmit,
    children,
    handleReset,
    values,
    txMethod,
    submitParams,
    isValid,
    setSubmitting,
    history,
    balances_totalIssuance,
    proposalType
  } = props;
  const errorLabelsProps = getFormErrorLabelsProps<GenericFormValues>(errors, touched);

  const onSubmit = (sendTx: () => void) => {
    if (isValid) sendTx();
  };

  const onTxFailed: TxFailedCallback = (txResult: SubmittableResult | null) => {
    setSubmitting(false);
  };

  const onTxSuccess: TxCallback = (txResult: SubmittableResult) => {
    if (!history) return;
    // Determine proposal id
    let createdProposalId: number | null = null;
    for (let e of txResult.events) {
      const event = e.get('event') as Event | undefined;
      if (event !== undefined && event.method === 'ProposalCreated') {
        createdProposalId = (event.data[1] as ProposalId).toNumber();
        break;
      }
    }
    setSubmitting(false);
    history.push(`/proposals/${ createdProposalId }`);
  };

  const requiredStake: number | undefined =
    balances_totalIssuance &&
    proposalType &&
    calculateStake(proposalType, balances_totalIssuance.toNumber());

  return (
    <div className="Forms">
      <Form className="proposal-form" onSubmit={handleSubmit}>
        <InputFormField
          label="Title"
          help="The title of your proposal"
          onChange={handleChange}
          name="title"
          placeholder="Title for your awesome proposal..."
          error={errorLabelsProps.title}
          value={values.title}
        />
        <TextareaFormField
          label="Rationale"
          help="The rationale behind your proposal"
          onChange={handleChange}
          name="rationale"
          placeholder="This proposal is awesome because..."
          error={errorLabelsProps.rationale}
          value={values.rationale}
        />
        {children}
        <Message warning visible>
          <Message.Content>
            <Icon name="warning circle" />
            Required stake: <b>{ formatBalance(requiredStake) }</b>
          </Message.Content>
        </Message>
        <div className="form-buttons">
          {txMethod ? (
            <TxButton
              type="submit"
              label="Submit proposal"
              icon="paper plane"
              isDisabled={isSubmitting || !isValid}
              params={(submitParams || []).map(p => (p === "{STAKE}" ? requiredStake : p))}
              tx={`proposalsCodex.${txMethod}`}
              onClick={onSubmit}
              txFailedCb={onTxFailed}
              txSuccessCb={onTxSuccess}
            />
          ) : (
            <Button type="submit" color="blue" loading={isSubmitting}>
              <Icon name="paper plane" />
              Submit
            </Button>
          )}

          <Button type="button" color="grey" onClick={handleReset}>
            <Icon name="times" />
            Clear
          </Button>
        </div>
      </Form>
    </div>
  );
};

// Helper that provides additional wrappers for proposal forms

export function withProposalFormData<ContainerPropsT, ExportPropsT>(
  FormContainerComponent: React.ComponentType<ContainerPropsT>
): React.ComponentType<ExportPropsT> {
  return withMulti(FormContainerComponent, withOnlyMembers, withCalls("query.balances.totalIssuance"));

}
