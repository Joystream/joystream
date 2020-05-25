import React from "react";
import { withFormik } from "formik";

export function withFormContainer<MyFormProps, FormValues>(formikProps: any) {
  return function(InnerForm: React.ComponentType<any>) {
    return withFormik<MyFormProps, FormValues>(formikProps)(function(props) {
      const handleBlur = (e: React.FocusEvent<HTMLInputElement>, data: any): void => {
        if (data && data.name) {
          props.setFieldValue(data.name, data.value);
          props.setFieldTouched(data.name);
        }
      };
      const handleChange = (e: React.ChangeEvent<HTMLInputElement>, data: any): void => {
        if (data && data.name) {
          props.setFieldValue(data.name, data.value);
          props.setFieldTouched(data.name);
        }
      };

      return <InnerForm {...props} handleBlur={handleBlur} handleChange={handleChange} />;
    });
  };
}
