import React from 'react';
import { Button } from 'semantic-ui-react';
import { Form, Field, withFormik, FormikProps } from 'formik';
import * as Yup from 'yup';

import { TxButton, Section } from '@polkadot/joy-utils/react/components';
import { SubmittableResult } from '@polkadot/api';
import { withMulti } from '@polkadot/react-api/hoc';

import * as JoyForms from '@polkadot/joy-utils/react/components/forms';
import { ThreadId } from '@joystream/types/common';
import { ReplyId } from '@joystream/types/forum';

import { withOnlyForumSudo } from './ForumSudo';
import { ValidationProps, withPostModerationValidation } from './validation';
import { TxFailedCallback, TxCallback } from '@polkadot/react-components/Status/types';

const buildSchema = (props: ValidationProps) => {
  const {
    postModerationRationaleConstraint: constraint
  } = props;

  if (!constraint) {
    throw new Error('Missing some validation constraints');
  }

  const minLen = constraint.min.toNumber();
  const maxLen = constraint.max.toNumber();

  return Yup.object().shape({
    rationale: Yup.string()
      .min(minLen, `Rationale is too short. Minimum length is ${minLen} chars.`)
      .max(maxLen, `Rationale is too long. Maximum length is ${maxLen} chars.`)
      .required('Rationale is required')
  });
};

type OuterProps = ValidationProps & {
  id: ThreadId | ReplyId;
  onCloseForm?: () => void;
};

type FormValues = {
  rationale: string;
};

type FormProps = OuterProps & FormikProps<FormValues>;

const LabelledField = JoyForms.LabelledField<FormValues>();

const InnerForm = (props: FormProps) => {
  const {
    id,
    onCloseForm,
    values,
    dirty,
    isValid,
    isSubmitting,
    setSubmitting
  } = props;

  const {
    rationale
  } = values;

  const closeForm = () => {
    if (onCloseForm) onCloseForm();
  };

  const onSubmit = (sendTx: () => void) => {
    if (isValid) sendTx();
  };

  const onTxFailed: TxFailedCallback = (txResult: SubmittableResult | null) => {
    setSubmitting(false);

    if (txResult == null) {
      // Tx cancelled.

    }
  };

  const onTxSuccess: TxCallback = (_txResult: SubmittableResult) => {
    setSubmitting(false);
    closeForm();
  };

  const isThread = id instanceof ThreadId;

  const buildTxParams = () => {
    if (!isValid) return [];

    if (isThread) {
      return [id, rationale];
    } else {
      return [id, rationale];
    }
  };

  const form =
    <Form className='ui form JoyForm EditEntityForm'>

      <LabelledField name='rationale' {...props}>
        <Field component='textarea' id='rationale' name='rationale' disabled={isSubmitting} rows={5} placeholder='Type a retionale here. You can use Markdown.' />
      </LabelledField>

      <LabelledField {...props} flex>
        <TxButton
          type='submit'
          label={'Moderate'}
          isDisabled={!dirty || isSubmitting}
          params={buildTxParams()}
          tx={isThread
            ? 'forum.moderateThread'
            : 'forum.moderatePost'
          }
          onClick={onSubmit}
          txFailedCb={onTxFailed}
          txSuccessCb={onTxSuccess}
        />
        <Button
          type='button'
          size='large'
          disabled={isSubmitting}
          onClick={closeForm}
          content='Cancel'
        />
      </LabelledField>
    </Form>;

  const sectionTitle = isThread
    ? 'Moderate this thread'
    : 'Moderate this reply';

  return <>
    <Section className='EditEntityBox' title={sectionTitle}>
      {form}
    </Section>
  </>;
};

const EditForm = withFormik<OuterProps, FormValues>({

  // Transform outer props into form values
  mapPropsToValues: (_props) => {
    return {
      rationale: ''
    };
  },

  validationSchema: buildSchema,

  handleSubmit: (values) => {
    // do submitting things
  }
})(InnerForm);

export const Moderate = withMulti<OuterProps>(
  EditForm,
  withOnlyForumSudo,
  withPostModerationValidation
);
