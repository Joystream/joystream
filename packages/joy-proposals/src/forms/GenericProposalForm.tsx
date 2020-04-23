import React from "react";
import { FormikProps, WithFormikConfig } from "formik";
import { Form, Icon, Button } from "semantic-ui-react";
import { getFormErrorLabelsProps } from "./errorHandling";
import * as Yup from "yup";
import { InputFormField, TextareaFormField } from "./FormFields";

export type GenericFormValues = {
  title: string;
  rationale: string;
}

export const genericFormDefaultValues: GenericFormValues = {
  title: '',
  rationale: '',
}

type GenericProposalFormProps = FormikProps<GenericFormValues>;

type GenericProposalFormAdditionalProps = {};

export type DefaultOuterFormProps<FormAdditionalPropsT, FormValuesT> = FormAdditionalPropsT & { initialData?: Partial<FormValuesT> };

type OuterFormProps = DefaultOuterFormProps<GenericProposalFormAdditionalProps, GenericFormValues>;

type DefaultGenericFormOptions = WithFormikConfig<OuterFormProps, GenericFormValues>;

export const genericFormDefaultOptions: DefaultGenericFormOptions = {
  mapPropsToValues: (props:OuterFormProps) => ({
    ...genericFormDefaultValues,
    ...(props.initialData || {})
  }),
  validationSchema: {
    title: Yup.string().required("Title is required!"),
    rationale: Yup.string().required("Rationale is required!"),
  },
  handleSubmit: (values, { setSubmitting, resetForm }) => {
    setTimeout(() => {
      console.log(JSON.stringify(values));
      resetForm();
      setSubmitting(false);
    }, 1000);
  },
}

// Generic proposal form with basic structure, "Title" and "Rationale" fields
// Other fields can be passed as children
export const GenericProposalForm: React.FunctionComponent<GenericProposalFormProps> = (props) => {
  const { handleChange, errors, isSubmitting, touched, handleSubmit, children, handleReset, values } = props;
  const errorLabelsProps = getFormErrorLabelsProps<GenericFormValues>(errors, touched);
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
        { children }
        <div className="form-buttons">
          <Button type="submit" color="blue" loading={isSubmitting}>
            <Icon name="paper plane" />
            Submit
          </Button>
          <Button type="button" color="grey" icon="times" onClick={handleReset}>
            <Icon name="times" />
            Cancel
          </Button>
        </div>
      </Form>
    </div>
  )
}
