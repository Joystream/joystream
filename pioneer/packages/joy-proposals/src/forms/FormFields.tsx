import React from 'react';
import { Form, FormInputProps, FormTextAreaProps, Label, LabelProps } from 'semantic-ui-react';
import LabelWithHelp from './LabelWithHelp';

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
  const fieldProps = { ...props, label: undefined };
  return (
    <FormField {...props}>
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
  const fieldProps = { ...props, label: undefined };
  return (
    <FormField {...props}>
      <Form.TextArea {...fieldProps}/>
    </FormField>
  );
}

type FormFieldProps = Omit<(InputFormFieldProps | TextareaFormFieldProps), 'error'> & {
  error?: LabelProps;
  showErrorMsg?: boolean;
};

export function FormField (props: React.PropsWithChildren<FormFieldProps>) {
  const { error, showErrorMsg = false, label, help, children } = props;
  return (
    <Form.Field error={!!error}>
      { (label && help)
        ? <LabelWithHelp text={ label.toString() } help={ help }/>
        : (label ? <label>{ label.toString() }</label> : null)
      }
      { children }
      { Boolean(showErrorMsg && error) && <Label {...error} prompt/> }
    </Form.Field>
  );
}

export default FormField;
