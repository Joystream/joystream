import React from "react";
import { FormikProps } from "formik";
import { Form, Icon, Button, Divider } from "semantic-ui-react";
import * as Yup from "yup";

import { withFormContainer } from "./FormContainer";
import "./forms.css";

type SetCouncilParamsProps = {
  handleClear: () => void;
};

interface FormValues {
  title: string;
  rationale: string;
  capacity: number;
}

function SetCouncilParamsForm(props: SetCouncilParamsProps & FormikProps<FormValues>) {
  const { handleChange, handleSubmit, isSubmitting } = props;
  return (
    <div className="Forms">
      <Form className="proposal-form" onSubmit={handleSubmit}>
        <Form.Input
          onChange={handleChange}
          label="Title"
          name="title"
          placeholder="Title for your awesome proposal..."
        />
        <Form.TextArea
          onChange={handleChange}
          label="Rationale"
          name="rationale"
          placeholder="This proposal is awesome because..."
        />
        <Divider horizontal>Voting </Divider>
        <Form.Group widths="equal">
          <Form.Input
            fluid
            onChange={handleChange}
            label="Announcing Period"
            name="announcingPeriod"
            placeholder="100"
          />
          <Form.Input fluid onChange={handleChange} label="Voting Period" name="votingPeriod" placeholder="100" />
          <Form.Input fluid onChange={handleChange} label="Revealing Period" name="revealingPeriod" placeholder="100" />
          <Form.Input
            fluid
            onChange={handleChange}
            label="Minimum Voting Stake"
            name="minVotingStake"
            placeholder="100"
          />
        </Form.Group>
        <Divider horizontal>Council</Divider>
        <Form.Group widths="equal">
          <Form.Input
            fluid
            onChange={handleChange}
            label="Minimum Council Stake"
            name="minCouncilStake"
            placeholder="100"
          />
          <Form.Input
            fluid
            onChange={handleChange}
            label="New Term Duration"
            name="newTermDuration"
            placeholder="100"
          />
          <Form.Input fluid onChange={handleChange} label="Council Size" name="councilSize" placeholder="100" />
          <Form.Input fluid onChange={handleChange} label="Candidacy Limit" name="candidacyLimit" placeholder="5" />
        </Form.Group>

        <div className="form-buttons">
          <Button type="submit" color="blue" loading={isSubmitting}>
            <Icon name="paper plane" />
            Submit
          </Button>
          <Button color="grey" icon="times" type="button">
            <Icon name="times" />
            Cancel
          </Button>
        </div>
      </Form>
    </div>
  );
}

type OuterFormProps = {
  initialTitle?: string;
  initialRationale?: string;
  initialCapacity?: number;
} & SetCouncilParamsProps;

export default withFormContainer<OuterFormProps, FormValues>({
  mapPropsToValues: () => ({
    title: "",
    rationale: "",
    capacity: 0
  }),
  validationSchema: Yup.object().shape({
    title: Yup.string().required("Title is required!"),
    rationale: Yup.string().required("Rationale is required!"),
    capacity: Yup.number().required("You need to specify a mint capacity for the council."),
    destinationAccount: Yup.string()
  }),
  handleSubmit: (values, { setSubmitting }) => {
    setTimeout(() => {
      console.log(JSON.stringify(values, null, 2));

      setSubmitting(false);
    }, 1000);
  },
  displayName: "SetCouncilParamsForm"
})(SetCouncilParamsForm);
