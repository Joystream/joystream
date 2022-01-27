import React from 'react';
import { Form, Field, withFormik, FormikProps } from 'formik';
import * as Yup from 'yup';

import TxButton from '@polkadot/joy-utils/react/components/TxButton';
import * as JoyForms from '@polkadot/joy-utils/react/components/forms';
import { SubmittableResult } from '@polkadot/api';
import { Button } from 'semantic-ui-react';
import { TxFailedCallback, TxCallback } from '@polkadot/react-components/Status/types';
import { ParsedPost, DiscussionContraints } from '@polkadot/joy-utils/types/proposals';
import { ThreadId } from '@joystream/types/common';
import { MemberId } from '@joystream/types/members';
import { Loading } from '@polkadot/joy-utils/react/components/PromiseComponent';

type OuterProps = {
  post?: ParsedPost;
  threadId: ThreadId;
  memberId: MemberId;
  onSuccess: () => void;
  constraints: DiscussionContraints;
};

type FormValues = {
  text: string;
};

type InnerProps = OuterProps & FormikProps<FormValues>;

const LabelledField = JoyForms.LabelledField<FormValues>();

const DiscussionPostFormInner = (props: InnerProps) => {
  const {
    isValid,
    isSubmitting,
    setSubmitting,
    resetForm,
    values,
    post,
    memberId,
    threadId,
    onSuccess
  } = props;

  const isEditForm = post && post.postId;

  const onSubmit = (sendTx: () => void) => {
    if (isValid) sendTx();
  };

  const onTxFailed: TxFailedCallback = (txResult: SubmittableResult | Error | null) => {
    setSubmitting(false);
  };

  const onTxSuccess: TxCallback = (_txResult: SubmittableResult) => {
    setSubmitting(false);
    resetForm();
    onSuccess();
  };

  const buildTxParams = () => {
    if (!isValid) return [];

    if (isEditForm) {
      return [
        memberId,
        threadId,
        post?.postId,
        values.text
      ];
    }

    return [
      memberId,
      threadId,
      values.text
    ];
  };

  return (
    <Form className='ui form JoyForm'>
      <LabelledField name='text' {...props}>
        <Field
          component='textarea'
          id='text'
          name='text'
          disabled={isSubmitting}
          rows={5}
          placeholder='Content of the post...' />
      </LabelledField>
      {
        isSubmitting
          ? <Loading text={'Submitting...'}/>
          : (
            <LabelledField invisibleLabel {...props} flex>
              <TxButton
                type='submit'
                label={isEditForm ? 'Update' : 'Add Post'}
                isDisabled={isSubmitting || !isValid}
                params={buildTxParams()}
                tx={isEditForm ? 'proposalsDiscussion.updatePost' : 'proposalsDiscussion.addPost'}
                onClick={onSubmit}
                txFailedCb={onTxFailed}
                txSuccessCb={onTxSuccess}
              />
              { isEditForm ? (
                <Button
                  type='button'
                  size='large'
                  disabled={isSubmitting}
                  color='red'
                  onClick={() => onSuccess()}
                  content='Cancel'
                />
              ) : (
                <Button
                  type='button'
                  size='large'
                  disabled={isSubmitting}
                  onClick={() => resetForm()}
                  content='Clear'
                />
              ) }
            </LabelledField>
          )
      }
    </Form>
  );
};

const DiscussionPostFormOuter = withFormik<OuterProps, FormValues>({
  // Transform outer props into form values
  mapPropsToValues: (props) => {
    const { post } = props;

    return { text: post && post.postId ? post.text : '' };
  },
  validationSchema: ({ constraints: c }: OuterProps) => (Yup.object().shape({
    text: Yup
      .string()
      .required('Post content is required')
      .max(c.maxPostLength, `The content cannot be longer than ${c.maxPostLength} characters`)
  })),
  handleSubmit: (values) => {
    // do submitting things
  }
})(DiscussionPostFormInner);

export default DiscussionPostFormOuter;
