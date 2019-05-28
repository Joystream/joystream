import React from 'react';
import { Button } from 'semantic-ui-react';
import { Form, Field, withFormik, FormikProps } from 'formik';
import * as Yup from 'yup';

import TxButton from '@polkadot/joy-utils/TxButton';
import { SubmittableResult } from '@polkadot/api';
import { /* withCalls, */ withMulti } from '@polkadot/ui-api/with';

import * as JoyForms from '@polkadot/joy-utils/forms';
import { ReplyId, ThreadId } from './types';
import Section from '@polkadot/joy-utils/Section';
import { useMyAccount } from '@polkadot/joy-utils/MyAccountContext';
import { useForum } from './Context';
import { withOnlyForumSudo } from './ForumSudo';

const buildSchema = (p: ValidationProps) => Yup.object().shape({
  rationale: Yup.string()
    // .min(p.minRationaleLen, `Rationale is too short. Minimum length is ${p.minRationaleLen} chars.`)
    // .max(p.maxRationaleLen, `Rationale is too long. Maximum length is ${p.maxRationaleLen} chars.`)
    .required('Rationale is required')
});

type ValidationProps = {
  // minRationaleLen: number,
  // maxRationaleLen: number
};

type OuterProps = ValidationProps & {
  id: ThreadId | ReplyId,
  onCloseForm?: () => void
};

type FormValues = {
  rationale: string
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

  const { state: { address: moderator } } = useMyAccount();
  const { dispatch } = useForum();

  if (!moderator) {
    return <em>Error: Current user should be a member.</em>;
  }

  const closeForm = () => {
    if (onCloseForm) onCloseForm();
  };

  const onSubmit = (sendTx: () => void) => {
    if (isValid) sendTx();
  };

  const onTxCancelled = () => {
    setSubmitting(false);
  };

  const onTxFailed = (_txResult: SubmittableResult) => {
    setSubmitting(false);
  };

  const onTxSuccess = (_txResult: SubmittableResult) => {
    setSubmitting(false);
    closeForm();
  };

  const isThread = id instanceof ThreadId;

  const buildTxParams = () => {
    if (!isValid) return [];

    if (isThread) {
      return [ /* TODO add all required params */ ];
    } else {
      return [ /* TODO add all required params */ ];
    }
  };

  const updateForumContext = () => {
    if (isThread) {
      dispatch({ type: 'ModerateThread', id: id.toNumber(), moderator, rationale });
    } else {
      dispatch({ type: 'ModerateReply', id: id.toNumber(), moderator, rationale });
    }
    closeForm();
  };

  const form =
    <Form className='ui form JoyForm EditEntityForm'>

      <LabelledField name='rationale' {...props}>
        <Field component='textarea' id='rationale' name='rationale' disabled={isSubmitting} rows={5} placeholder='Type a retionale here. You can use Markdown.' />
      </LabelledField>

      <LabelledField {...props}>

        { /* TODO delete this button once integrated w/ substrate */ }
        <Button
          type='button'
          size='large'
          primary
          disabled={!dirty || isSubmitting}
          onClick={updateForumContext}
          content={'Moderate'}
        />

        <TxButton
          style={{ display: 'none' }} // TODO delete once integrated w/ substrate
          type='submit'
          size='large'
          label={'Moderate'}
          isDisabled={!dirty || isSubmitting}
          params={buildTxParams()}
          tx={isThread
            ? 'forum.moderateThread'
            : 'forum.moderatePost'
          }
          onClick={onSubmit}
          txCancelledCb={onTxCancelled}
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
  mapPropsToValues: _props => {
    return {
      rationale: ''
    };
  },

  validationSchema: buildSchema,

  handleSubmit: values => {
    // do submitting things
  }
})(InnerForm);

export const Moderate = withMulti<OuterProps>(
  EditForm,
  withOnlyForumSudo
);
