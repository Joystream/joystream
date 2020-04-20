import React from "react";
import { FormikProps, WithFormikConfig } from "formik";
import { Form, Icon, Button } from "semantic-ui-react";
import { getFormErrorLabelsProps } from "./errorHandling";
import * as Yup from "yup";
import LabelWithHelp from './LabelWithHelp';

export type GenericFormValues = {
  title: string;
  rationale: string;
}

export const genericFormDefaultValues: GenericFormValues = {
  title: '',
  rationale: '',
}

type GenericProposalFormProps = {
  handleChange: FormikProps<GenericFormValues>["handleChange"],
  errors: FormikProps<GenericFormValues>["errors"],
  isSubmitting: FormikProps<GenericFormValues>["isSubmitting"],
  touched: FormikProps<GenericFormValues>["touched"],
  handleSubmit: FormikProps<GenericFormValues>["handleSubmit"]
}

type DefaultGenericFormOptions = WithFormikConfig<GenericProposalFormProps, GenericFormValues>;

export type DefaultOuterFormProps<FormPropsT, FormValuesT> = FormPropsT & { initialData?: Partial<FormValuesT> };

export const genericFormDefaultOptions: DefaultGenericFormOptions = {
  mapPropsToValues: (props:DefaultOuterFormProps<GenericProposalFormProps, GenericFormValues>) => ({
    ...genericFormDefaultValues,
    ...(props.initialData || {})
  }),
  validationSchema: {
    title: Yup.string().required("Title is required!"),
    rationale: Yup.string().required("Rationale is required!"),
  },
  handleSubmit: (values, { setSubmitting, resetForm }) => {
    setTimeout(() => {
      alert(JSON.stringify(values, null, 2));
      setSubmitting(false);
    }, 1000);
  },
}

// Generic proposal form with basic structure, "Title" and "Rationale" fields
// Other fields can be passed as children
export const GenericProposalForm: React.FunctionComponent<GenericProposalFormProps> = (props) => {
  const { handleChange, errors, isSubmitting, touched, handleSubmit, children } = props;
  const errorLabelsProps = getFormErrorLabelsProps<GenericFormValues>(errors, touched);
  return (
    <div className="Forms">
      <Form className="proposal-form" onSubmit={handleSubmit}>
        <Form.Field error={Boolean(errorLabelsProps.title)}>
          <LabelWithHelp text="Title" help="The title of your proposal"/>
          <Form.Input
            onChange={handleChange}
            name="title"
            placeholder="Title for your awesome proposal..."
            error={errorLabelsProps.title}
          />
        </Form.Field>
        <Form.Field error={Boolean(errorLabelsProps.rationale)}>
          <LabelWithHelp text="Rationale" help="The rationale behind your proposal"/>
          <Form.TextArea
            onChange={handleChange}
            name="rationale"
            placeholder="This proposal is awesome because..."
            error={errorLabelsProps.rationale}
          />
        </Form.Field>
        { children }
        <div className="form-buttons">
          <Button type="submit" color="blue" loading={isSubmitting}>
            <Icon name="paper plane" />
            Submit
          </Button>
          <Button color="grey" icon="times">
            <Icon name="times" />
            Cancel
          </Button>
        </div>
      </Form>
    </div>
  )
}
