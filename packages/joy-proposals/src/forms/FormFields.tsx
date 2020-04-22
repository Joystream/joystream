import React from "react";
import { Form, FormInputProps, FormTextAreaProps } from "semantic-ui-react";
import LabelWithHelp from './LabelWithHelp';

/*
 * Generic form field components
 *
 * The idea is to provide an easy way of introducing new logic,
 * that will affect all of the exsiting form fields (or all fields of given type)
 * and to easily switch the structure/display of a typical form field.
*/

type InputFormFieldProps = FormInputProps & {
  help?: string,
  unit?: string
};

export function InputFormField(props:InputFormFieldProps) {
  const { unit } = props;
  const fieldProps = { ...props, label: undefined };
  return (
    <FormField {...props}>
      <Form.Input
        {...fieldProps}
        style={ unit ? { display: "flex", alignItems: "center" } : undefined }>
          <input />
          { unit && <div style={{ margin: "0 0 0 1rem" }}>{unit}</div> }
      </Form.Input>
    </FormField>
  );
}

type TextareaFormFieldProps = FormTextAreaProps & {
  help?: string,
};

export function TextareaFormField(props:TextareaFormFieldProps) {
  const fieldProps = { ...props, label: undefined };
  return (
    <FormField {...props}>
      <Form.TextArea {...fieldProps}/>
    </FormField>
  );
}

type FormFieldProps = InputFormFieldProps | TextareaFormFieldProps;

export function FormField(props: React.PropsWithChildren<FormFieldProps>) {
  const { error, label, help, children } = props;
  return (
    <Form.Field error={Boolean(error)}>
      { (label && help) ?
        <LabelWithHelp text={ label.toString() } help={ help }/>
        : ( label ? <label>{ label.toString() }</label> : null )
      }
      { children }
    </Form.Field>
  );
}

export default FormField;
