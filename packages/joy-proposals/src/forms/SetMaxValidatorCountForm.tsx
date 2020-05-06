import React from "react";
import { getFormErrorLabelsProps } from "./errorHandling";
import * as Yup from "yup";
import {
  GenericProposalForm,
  GenericFormValues,
  genericFormDefaultOptions,
  genericFormDefaultValues,
  withProposalFormData,
  ProposalFormExportProps,
  ProposalFormContainerProps,
  ProposalFormInnerProps
} from "./GenericProposalForm";
import Validation from "../validationSchema";
import { InputFormField } from "./FormFields";
import { withFormContainer } from "./FormContainer";
import "./forms.css";

type FormValues = GenericFormValues & {
  maxValidatorCount: string;
};

const defaultValues: FormValues = {
  ...genericFormDefaultValues,
  maxValidatorCount: ""
};

type FormAdditionalProps = {}; // Aditional props coming all the way from export comonent into the inner form.
type ExportComponentProps = ProposalFormExportProps<FormAdditionalProps, FormValues>;
type FormContainerProps = ProposalFormContainerProps<ExportComponentProps>;
type FormInnerProps = ProposalFormInnerProps<FormContainerProps, FormValues>;

const SetMaxValidatorCountForm: React.FunctionComponent<FormInnerProps> = props => {
  const { handleChange, errors, touched, values } = props;
  const errorLabelsProps = getFormErrorLabelsProps<FormValues>(errors, touched);
  return (
    <GenericProposalForm
      {...props}
      txMethod="createSetValidatorCountProposal"
      proposalType="SetValidatorCount"
      submitParams={[props.myMemberId, values.title, values.rationale, "{STAKE}", values.maxValidatorCount]}
    >
      <InputFormField
        error={errorLabelsProps.maxValidatorCount}
        label="Max Validator Count"
        help="The new value for maximum number of Validators that you propose"
        onChange={handleChange}
        name="maxValidatorCount"
        placeholder="20"
        value={values.maxValidatorCount}
      />
    </GenericProposalForm>
  );
};

const FormContainer = withFormContainer<FormContainerProps, FormValues>({
  mapPropsToValues: (props: FormContainerProps) => ({
    ...defaultValues,
    ...(props.initialData || {})
  }),
  validationSchema: Yup.object().shape({
    ...genericFormDefaultOptions.validationSchema,
    maxValidatorCount: Validation.SetValidatorCount.maxValidatorCount
  }),
  handleSubmit: genericFormDefaultOptions.handleSubmit,
  displayName: "SetMaxValidatorCountForm"
})(SetMaxValidatorCountForm);

export default withProposalFormData<FormContainerProps, ExportComponentProps>(FormContainer);
