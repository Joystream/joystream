import React from "react";
import { Form, FormInputProps } from "semantic-ui-react";
import LabelWithHelp from './LabelWithHelp';

type FormFieldProps = FormInputProps & {
  help?: string,
  unit?: string
};

// Generic form field component
//
// TODO: Currently it only handles Input fields,
// but this can be extended for all common form field types.
//
// The idea is to provide an easy way of introducing new logic,
// that will affect all of the exsiting form fields (or all fields of given type)
// and to easily switch the structure and display of a typical form field.
export const FormField: React.FunctionComponent<FormFieldProps> = props => {
  const { error, label, help, onChange, name, placeholder, unit } = props;
  return (
    <Form.Field error={Boolean(error)}>
      { (label && help) ?
        <LabelWithHelp text={ label.toString() } help={ help }/>
        : ( label ? <label>{ label.toString() }</label> : null )
      }
      <Form.Input
        fluid
        onChange={onChange}
        name={ name }
        placeholder={ placeholder }
        error={error}
        style={ unit ? { display: "flex", alignItems: "center" } : undefined }
      >
        <input />
        { unit && <div style={{ margin: "0 0 0 1rem" }}>{unit}</div> }
      </Form.Input>
    </Form.Field>
  );
}

export default FormField;
