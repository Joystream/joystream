import { FormikErrors, FormikTouched } from 'formik';
import { LabelProps } from 'semantic-ui-react';

type FieldErrorLabelProps = LabelProps | undefined; // This is used for displaying semantic-ui errors
export type FormErrorLabelsProps<ValuesT> = { [T in keyof ValuesT]: FieldErrorLabelProps };

// Single form field error state.
// Takes formik "errors" and "touched" objects and the field name as arguments.
// Returns value to use ie. in the semantic-ui Form.Input error prop.
export function getErrorLabelProps<ValuesT> (
  errors: FormikErrors<ValuesT>,
  touched: FormikTouched<ValuesT>,
  fieldName: keyof ValuesT,
  pointing: LabelProps['pointing'] = undefined

): FieldErrorLabelProps | undefined {
  return (errors[fieldName] && touched[fieldName])
    ? { content: errors[fieldName], pointing, size: 'large' }
    : undefined;
}

// All form fields error states (uses default value for "pointing").
// Takes formik "errors" and "touched" objects as arguments.
// Returns object with field names as properties and values that can be used ie. for semantic-ui Form.Input error prop
export function getFormErrorLabelsProps<ValuesT> (
  errors: FormikErrors<ValuesT>,
  touched: FormikTouched<ValuesT>
): FormErrorLabelsProps<ValuesT> {
  const errorStates: Partial<FormErrorLabelsProps<ValuesT>> = {};
  for (const fieldName in errors) {
    errorStates[fieldName] = getErrorLabelProps<ValuesT>(errors, touched, fieldName);
  }

  return errorStates as FormErrorLabelsProps<ValuesT>;
}
