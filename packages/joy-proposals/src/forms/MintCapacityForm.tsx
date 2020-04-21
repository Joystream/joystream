import React from "react";
import { FormikProps, WithFormikConfig } from "formik";
import * as Yup from "yup";
import { getFormErrorLabelsProps } from "./errorHandling";
import {
  GenericProposalForm,
  GenericFormValues,
  genericFormDefaultOptions,
  DefaultOuterFormProps,
  genericFormDefaultValues
} from './GenericProposalForm';
import { InputFormField } from "./FormFields";
import { withFormContainer } from "./FormContainer";
import "./forms.css";

type FormValues = GenericFormValues & {
  capacity: string
}

const defaultValues: FormValues = {
  ...genericFormDefaultValues,
  capacity: '',
};

type MintCapacityGroup = 'Council' | 'Content Working Group';

type FormAdditionalProps = {
  mintCapacityGroup: MintCapacityGroup
};

type MintCapacityProps = FormikProps<FormValues> & FormAdditionalProps;

const MintCapacityForm: React.FunctionComponent<MintCapacityProps> = props => {
  const { handleChange, errors, touched, mintCapacityGroup, values } = props;
  const errorLabelsProps = getFormErrorLabelsProps<FormValues>(errors, touched);
  return (
    <GenericProposalForm {...props}>
      <InputFormField
        error={errorLabelsProps.capacity}
        onChange={handleChange}
        name="capacity"
        placeholder="100"
        label={ `${ mintCapacityGroup } Mint Capacity` }
        help={ `The new mint capacity you propse for ${ mintCapacityGroup }` }
        unit="tJOY"
        value={values.capacity}
      />
    </GenericProposalForm>
  );
}

type OuterFormProps = DefaultOuterFormProps<FormAdditionalProps, FormValues>;
type OutermostFormProps = OuterFormProps & { handleSubmit: WithFormikConfig<OuterFormProps, FormValues>["handleSubmit"] };
export default (props:OutermostFormProps) => {
  const FormContainer = withFormContainer<OuterFormProps, FormValues>({
    mapPropsToValues: (props:OuterFormProps) => ({
      ...defaultValues,
      ...(props.initialData || {})
    }),
    validationSchema: Yup.object().shape({
      ...genericFormDefaultOptions.validationSchema,
      capacity: Yup.number().required("You need to specify the mint capacity.")
    }),
    handleSubmit: props.handleSubmit,
    displayName: `${ props.mintCapacityGroup }MintCapacityForm`
  })(MintCapacityForm);

  return <FormContainer mintCapacityGroup={props.mintCapacityGroup}/>
}
