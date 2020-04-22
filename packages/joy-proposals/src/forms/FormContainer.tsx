import React from "react";
import { withFormik } from "formik";

export function withFormContainer<MyFormProps, FormValues>(formikProps) {
  return function(InnerForm: React.ComponentType<any>) {
    return withFormik<MyFormProps, FormValues>(formikProps)(function(props) {
      const handleBlur = (e, data: any) => {
        if (data && data.name) {
          props.setFieldValue(data.name, data.value);
          props.setFieldTouched(data.name);
        }
      };
      const handleChange = (e, data: any) => {
        if (data && data.name) {
          props.setFieldValue(data.name, data.value);
          props.setFieldTouched(data.name);
        }
      };

      return <InnerForm {...props} handleBlur={handleBlur} handleChange={handleChange} />;
    });
  };
}
