import React from "react";
import { withFormik } from "formik";

// Our inner form component. Will be wrapped with Formik({..})
// const MyInnerForm = props => {
//   const { values, touched, errors, dirty, isSubmitting, handleChange, handleBlur, handleSubmit, handleReset } = props;
//   const options = [
//     { key: 1, text: "Yes", value: true },
//     { key: 2, text: "No", value: false }
//   ];

//   return (
//     <Form>
//       <Form.Input onChange={handleChange} label="Email" name="email" placeholder="Email address" />
//       <Form.Dropdown
//         onChange={handleChange}
//         name="agree"
//         text="I agree to the Terms and Conditions"
//         options={options}
//       />
//       <Button type="submit">Submit</Button>
//     </Form>
//   );
// };

export function withFormContainer<MyFormProps, FormValues>(formikProps) {
  return function(InnerForm: React.ComponentType<any>) {
    return withFormik<MyFormProps, FormValues>(formikProps)(function(props) {
      let handleBlur = (e, data: any) => {
        if (data && data.name) {
          props.setFieldValue(data.name, data.value);
          props.setFieldTouched(data.name);
        }
      };
      let handleChange = (e, data: any) => {
        if (data && data.name) {
          props.setFieldValue(data.name, data.value);
          props.setFieldTouched(data.name);
        }
      };

      return <InnerForm {...props} handleBlur={handleBlur} handleChange={handleChange} />;
    });
  };
}

// const EnhancedForm = withSemanticUIFormik({
//   mapPropsToValues: () => ({ email: "", agree: false }),
//   validationSchema: Yup.object().shape({
//     email: Yup.string()
//       .email("Invalid email address")
//       .required("Email is required!")
//   }),
//   handleSubmit: (values, { setSubmitting }) => {
//     setTimeout(() => {
//       alert(JSON.stringify(values, null, 2));
//       setSubmitting(false);
//     }, 1000);
//   },
//   displayName: "BasicForm" // helps with React DevTools
// })(MyInnerForm);
