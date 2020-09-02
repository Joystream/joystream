import React from 'react';
import { Form } from 'semantic-ui-react';
import * as Yup from 'yup';
import { GenericProposalForm,
  GenericFormValues,
  genericFormDefaultValues,
  withProposalFormData,
  ProposalFormExportProps,
  ProposalFormContainerProps,
  ProposalFormInnerProps } from './GenericProposalForm';
import Validation from '../validationSchema';
import { withFormContainer } from './FormContainer';
import FileDropdown from './FileDropdown';
import { u32 } from '@polkadot/types/primitive';
import { withCalls } from '@polkadot/react-api';

export type FormValues = GenericFormValues & {
  // wasm blob as ArrayBuffer, or an Error string
  WASM: ArrayBuffer | string;
};

const defaultValues: FormValues = {
  ...genericFormDefaultValues,
  WASM: new ArrayBuffer(0)
};

type FormAdditionalProps = Record<any, never>; // Aditional props coming all the way from export comonent into the inner form.
type ExportComponentProps = ProposalFormExportProps<FormAdditionalProps, FormValues>;
type FormContainerProps = ProposalFormContainerProps<ExportComponentProps> & {
  maxFileSize: u32;
};
type FormInnerProps = ProposalFormInnerProps<FormContainerProps, FormValues>;

const RuntimeUpgradeForm: React.FunctionComponent<FormInnerProps> = (props) => {
  const { errors, setFieldValue, setFieldTouched, values, touched } = props;

  return (
    <GenericProposalForm
      {...props}
      txMethod='createRuntimeUpgradeProposal'
      proposalType='RuntimeUpgrade'
      submitParams={[values.WASM]}
    >
      <Form.Field>
        <FileDropdown<FormValues>
          setFieldValue={setFieldValue}
          setFieldTouched={setFieldTouched}
          defaultText='Drag-n-drop WASM bytecode of a runtime upgrade (*.wasm)'
          acceptedFormats='.wasm'
          name='WASM'
          error={touched.WASM ? errors.WASM : undefined}
          interpretAs='binary'
        />
      </Form.Field>
    </GenericProposalForm>
  );
};

const FormContainer = withFormContainer<FormContainerProps, FormValues>({
  mapPropsToValues: (props: FormContainerProps) => ({
    ...defaultValues,
    ...(props.initialData || {})
  }),
  validationSchema: (props: FormContainerProps) => Yup.object().shape({
    ...Validation.All(),
    ...Validation.RuntimeUpgrade(props.maxFileSize.toNumber())
  }),
  handleSubmit: () => null,
  displayName: 'RuntimeUpgradeForm'
})(RuntimeUpgradeForm);

export default withCalls<ExportComponentProps>(
  ['consts.proposalsCodex.runtimeUpgradeWasmProposalMaxLength', { propName: 'maxFileSize' }]
)(
  withProposalFormData<FormContainerProps, ExportComponentProps>(FormContainer)
);
