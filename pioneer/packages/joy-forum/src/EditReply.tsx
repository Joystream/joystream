import React from 'react';
import { Button, Message } from 'semantic-ui-react';
import styled from 'styled-components';
import { Form, Field, withFormik, FormikProps } from 'formik';
import * as Yup from 'yup';

import TxButton from '@polkadot/joy-utils/TxButton';
import { SubmittableResult } from '@polkadot/api';
import { withMulti } from '@polkadot/react-api/with';

import * as JoyForms from '@polkadot/joy-utils/forms';
import { Text } from '@polkadot/types';
import { PostId, ThreadId } from '@joystream/types/common';
import { Post } from '@joystream/types/forum';
import { withOnlyMembers } from '@polkadot/joy-utils/MyAccount';
import Section from '@polkadot/joy-utils/Section';
import { useMyAccount } from '@polkadot/joy-utils/MyAccountContext';
import { withForumCalls } from './calls';
import { ValidationProps, withReplyValidation } from './validation';
import { TxFailedCallback, TxCallback } from '@polkadot/react-components/Status/types';

const buildSchema = (props: ValidationProps) => {
  const {
    postTextConstraint
  } = props;

  if (!postTextConstraint) {
    throw new Error('Missing some validation constraints');
  }

  const minText = postTextConstraint.min.toNumber();
  const maxText = postTextConstraint.max.toNumber();

  return Yup.object().shape({
    text: Yup.string()
      .min(minText, `Reply text is too short. Minimum length is ${minText} chars.`)
      .max(maxText, `Reply text is too long. Maximum length is ${maxText} chars.`)
      .required('Text is required')
  });
};

const FormActionsContainer = styled.div`
  display: flex;
  justify-content: space-between;
`;

type OuterProps = ValidationProps & {
  id?: PostId;
  struct?: Post;
  threadId: ThreadId;
  quotedPost?: Post | null;
  onEditSuccess?: () => void;
  onEditCancel?: () => void;
};

type FormValues = {
  text: string;
};

type FormProps = OuterProps & FormikProps<FormValues>;

const LabelledField = JoyForms.LabelledField<FormValues>();

const InnerForm = (props: FormProps) => {
  const {
    id,
    threadId,
    struct,
    values,
    dirty,
    isValid,
    isSubmitting,
    setSubmitting,
    resetForm,
    onEditSuccess,
    onEditCancel
  } = props;

  const {
    text
  } = values;

  const isNew = struct === undefined;

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
    resetForm();
    if (!isNew && onEditSuccess) {
      onEditSuccess();
    }
  };

  const buildTxParams = () => {
    if (!isValid) return [];

    const textParam = new Text(text);
    if (!id) {
      return [threadId, textParam];
    } else {
      return [id, textParam];
    }
  };

  const form =
    <Form className='ui form JoyForm EditEntityForm'>

      <LabelledField name='text' {...props}>
        <Field component='textarea' id='text' name='text' disabled={isSubmitting} rows={5} placeholder='Type here. You can use Markdown.' />
      </LabelledField>

      <LabelledField {...props}>
        <FormActionsContainer>
          <div>
            <TxButton
              type='submit'
              size='large'
              label={isNew
                ? 'Post a reply'
                : 'Update a reply'
              }
              isDisabled={!dirty || isSubmitting}
              params={buildTxParams()}
              tx={isNew
                ? 'forum.addPost'
                : 'forum.editPostText'
              }
              onClick={onSubmit}
              txFailedCb={onTxFailed}
              txSuccessCb={onTxSuccess}
            />
            <Button
              type='button'
              size='large'
              disabled={!dirty || isSubmitting}
              onClick={() => resetForm()}
              content='Reset form'
            />
          </div>
          {
            !isNew && (
              <Button
                type='button'
                size='large'
                disabled={isSubmitting}
                content='Cancel edit'
                onClick={() => onEditCancel && onEditCancel()}
              />
            )
          }
        </FormActionsContainer>
      </LabelledField>
    </Form>;

  const sectionTitle = isNew
    ? 'New reply'
    : `Edit my reply #${struct?.nr_in_thread}`;

  return (
    <Section className='EditEntityBox' title={sectionTitle}>
      {form}
    </Section>
  );
};

const getQuotedPostString = (post: Post) => {
  const lines = post.current_text.split('\n');
  return lines.reduce((acc, line) => {
    return `${acc}> ${line}\n`;
  }, '');
};

const EditForm = withFormik<OuterProps, FormValues>({

  // Transform outer props into form values
  mapPropsToValues: props => {
    const { struct, quotedPost } = props;
    return {
      text: struct
        ? struct.current_text
        : quotedPost
          ? getQuotedPostString(quotedPost)
          : ''
    };
  },

  validationSchema: buildSchema,

  handleSubmit: values => {
    // do submitting things
  }
})(InnerForm);

function FormOrLoading (props: OuterProps) {
  const { state: { address } } = useMyAccount();
  const { struct } = props;

  if (!address || !struct) {
    return <em>Loading reply...</em>;
  }

  if (struct.isEmpty) {
    return <em>Reply not found</em>;
  }

  const isMyStruct = address === struct.author_id.toString();
  if (isMyStruct) {
    return <EditForm {...props} threadId={struct.thread_id} />;
  }

  return <Message error className='JoyMainStatus' header='You are not allowed edit this reply.' />;
}

export const NewReply = withMulti(
  EditForm,
  withOnlyMembers,
  withReplyValidation
);

export const EditReply = withMulti(
  FormOrLoading,
  withOnlyMembers,
  withReplyValidation,
  withForumCalls<OuterProps>(
    ['postById', { paramName: 'id', propName: 'struct' }]
  )
);
