import React from 'react';
import { Button, Message } from 'semantic-ui-react';
import { Form, Field, withFormik, FormikProps } from 'formik';
import * as Yup from 'yup';
import { History } from 'history';

import TxButton from '@polkadot/joy-utils/TxButton';
import { SubmittableResult } from '@polkadot/api';
import { withMulti } from '@polkadot/react-api/with';

import * as JoyForms from '@polkadot/joy-utils/forms';
import { Text } from '@polkadot/types';
import { PostId, Post, ThreadId } from '@joystream/types/lib/forum';
import { withOnlyMembers } from '@polkadot/joy-utils/MyAccount';
import Section from '@polkadot/joy-utils/Section';
import { useMyAccount } from '@polkadot/joy-utils/MyAccountContext';
import { UrlHasIdProps, CategoryCrumbs } from './utils';
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

type OuterProps = ValidationProps & {
  history?: History,
  id?: PostId
  struct?: Post
  threadId: ThreadId
};

type FormValues = {
  text: string
};

type FormProps = OuterProps & FormikProps<FormValues>;

const LabelledField = JoyForms.LabelledField<FormValues>();

const InnerForm = (props: FormProps) => {
  const {
    history,
    id,
    threadId,
    struct,
    values,
    dirty,
    isValid,
    isSubmitting,
    setSubmitting,
    resetForm
  } = props;

  const {
    text
  } = values;

  const onSubmit = (sendTx: () => void) => {
    if (isValid) sendTx();
  };

  const onTxFailed: TxFailedCallback = (txResult: SubmittableResult | null) => {
    setSubmitting(false);
    if (txResult == null) {
      // Tx cancelled.
      return;
    }
  };

  const onTxSuccess: TxCallback = (_txResult: SubmittableResult) => {
    setSubmitting(false);
    goToThreadView();
  };

  const isNew = struct === undefined;

  const buildTxParams = () => {
    if (!isValid) return [];

    const textParam = new Text(text);
    if (!id) {
      return [ threadId, textParam ];
    } else {
      return [ id, textParam ];
    }
  };

  const goToThreadView = () => {
    if (history) {
      history.push('/forum/threads/' + threadId.toString());
    }
  };

  const form =
    <Form className='ui form JoyForm EditEntityForm'>

      <LabelledField name='text' {...props}>
        <Field component='textarea' id='text' name='text' disabled={isSubmitting} rows={5} placeholder='Type here. You can use Markdown.' />
      </LabelledField>

      <LabelledField {...props}>
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
      </LabelledField>
    </Form>;

  const sectionTitle = isNew
    ? 'New reply'
    : 'Edit my reply';

  return <>
    <CategoryCrumbs threadId={threadId} />
    <Section className='EditEntityBox' title={sectionTitle}>
      {form}
    </Section>
  </>;
};

const EditForm = withFormik<OuterProps, FormValues>({

  // Transform outer props into form values
  mapPropsToValues: props => {
    const { struct } = props;
    return {
      text: struct && struct.current_text || ''
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

function withThreadIdFromUrl (Component: React.ComponentType<OuterProps>) {
  return function (props: UrlHasIdProps) {
    const { match: { params: { id } } } = props;
    try {
      return <Component {...props} threadId={new ThreadId(id)} />;
    } catch (err) {
      return <em>Invalid thread ID: {id}</em>;
    }
  };
}

type HasPostIdProps = {
  id: PostId
};

function withIdFromUrl (Component: React.ComponentType<HasPostIdProps>) {
  return function (props: UrlHasIdProps) {
    const { match: { params: { id } } } = props;
    try {
      return <Component {...props} id={new PostId(id)} />;
    } catch (err) {
      return <em>Invalid reply ID: {id}</em>;
    }
  };
}

export const NewReply = withMulti(
  EditForm,
  withOnlyMembers,
  withThreadIdFromUrl,
  withReplyValidation
);

export const EditReply = withMulti(
  FormOrLoading,
  withOnlyMembers,
  withIdFromUrl,
  withReplyValidation,
  withForumCalls<OuterProps>(
    ['postById', { paramName: 'id', propName: 'struct' }]
  )
);
