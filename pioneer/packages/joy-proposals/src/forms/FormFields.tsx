import React from 'react';
import { Form, FormInputProps, FormTextAreaProps, Label, LabelProps, Checkbox } from 'semantic-ui-react';
import { FormikProps } from 'formik';
import LabelWithHelp from './LabelWithHelp';
import { FormErrorLabelsProps } from './errorHandling';
import { formatBalance } from '@polkadot/util';
import styled from 'styled-components';

/*
 * Generic form field components
 *
 * The idea is to provide an easy way of introducing new logic,
 * that will affect all of the exsiting form fields (or all fields of given type)
 * and to easily switch the structure/display of a typical form field.
*/

type InputFormFieldProps = Omit<FormInputProps, 'error'> & {
  help?: string;
  unit?: string;
  error?: LabelProps;
};

export function InputFormField (props: InputFormFieldProps) {
  const { unit } = props;
  const fieldProps = { ...props, label: undefined, error: undefined };
  return (
    <FormField {...props} showErrorMsg={true}>
      <Form.Input
        {...fieldProps}
        style={ unit ? { display: 'flex', alignItems: 'center' } : undefined }>
        <input />
        { unit && <div style={{ margin: '0 0 0 1rem' }}>{unit}</div> }
      </Form.Input>
    </FormField>
  );
}

type TextareaFormFieldProps = Omit<FormTextAreaProps, 'error'> & {
  help?: string;
  error?: LabelProps;
};

export function TextareaFormField (props: TextareaFormFieldProps) {
  const fieldProps = { ...props, label: undefined, error: undefined };
  return (
    <FormField {...props} showErrorMsg={true}>
      <Form.TextArea {...fieldProps}/>
    </FormField>
  );
}

type FormFieldProps = Omit<(InputFormFieldProps | TextareaFormFieldProps), 'error'> & {
  error?: LabelProps;
  showErrorMsg?: boolean;
};

const StyledFormField = styled(Form.Field)`
  & .field {
    margin-bottom: 0 !important;
  }
`;

export function FormField (props: React.PropsWithChildren<FormFieldProps>) {
  const { error, showErrorMsg = false, label, help, children } = props;
  return (
    <StyledFormField error={!!error}>
      { (label && help)
        ? <LabelWithHelp text={ label.toString() } help={ help }/>
        : (label ? <label>{ label.toString() }</label> : null)
      }
      { children }
      { Boolean(showErrorMsg && error) && <Label {...error} prompt/> }
    </StyledFormField>
  );
}

type ReawrdPolicyFieldsType = {
  rewardAmount: string;
  rewardNextBlock: string;
  rewardRecurring: boolean;
  rewardInterval: string;
}
type RewardPolicyFieldsProps<ValuesT extends ReawrdPolicyFieldsType> =
  Pick<FormikProps<ValuesT>, 'values' | 'handleChange' | 'setFieldValue'> & {
    errorLabelsProps: FormErrorLabelsProps<ValuesT>;
  };
export function RewardPolicyFields<ValuesT extends ReawrdPolicyFieldsType> ({
  values,
  errorLabelsProps,
  handleChange,
  setFieldValue
}: RewardPolicyFieldsProps<ValuesT>) {
  return (
    <>
      <InputFormField
        label="Amount per payout"
        unit={formatBalance.getDefaults().unit}
        onChange={handleChange}
        name={'rewardAmount'}
        error={errorLabelsProps.rewardAmount}
        value={values.rewardAmount}
        placeholder={'ie. 100'}
      />
      <InputFormField
        label="Next payment at block"
        onChange={handleChange}
        name={'rewardNextBlock'}
        error={errorLabelsProps.rewardNextBlock}
        value={values.rewardNextBlock}
      />
      <FormField>
        <Checkbox
          toggle
          onChange={(e, data) => { setFieldValue('rewardRecurring', data.checked); }}
          label={'Recurring'}
          checked={values.rewardRecurring}/>
      </FormField>
      { values.rewardRecurring && (
        <InputFormField
          label="Reward interval"
          onChange={handleChange}
          name={'rewardInterval'}
          error={errorLabelsProps.rewardInterval}
          value={values.rewardInterval}
          unit={'Blocks'}
        />
      ) }
    </>
  );
}

export default FormField;
