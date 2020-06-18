import React from 'react';
// import { Button, Checkbox as SuiCheckbox, CheckboxProps as SuiCheckboxProps, Message } from 'semantic-ui-react';
// import { Form, Field, FieldProps, withFormik, FormikProps } from 'formik';
import { Button, Message } from 'semantic-ui-react';
import { Form, Field, withFormik, FormikProps } from 'formik';
import * as Yup from 'yup';
import { History } from 'history';

import TxButton from '@polkadot/joy-utils/TxButton';
import { SubmittableResult } from '@polkadot/api';
import { withMulti } from '@polkadot/react-api/with';

import * as JoyForms from '@polkadot/joy-utils/forms';
import { Text } from '@polkadot/types';
import { ThreadId } from '@joystream/types/common';
import { Thread, CategoryId } from '@joystream/types/forum';
import { withOnlyMembers } from '@polkadot/joy-utils/MyAccount';
import Section from '@polkadot/joy-utils/Section';
import { useMyAccount } from '@polkadot/joy-utils/MyAccountContext';
import { UrlHasIdProps, CategoryCrumbs } from './utils';
import { withForumCalls } from './calls';
import { ValidationProps, withThreadValidation } from './validation';
import { TxFailedCallback, TxCallback } from '@polkadot/react-components/Status/types';

const buildSchema = (props: ValidationProps) => {
  const {
    threadTitleConstraint,
    postTextConstraint
  } = props;

  if (!threadTitleConstraint || !postTextConstraint) {
    throw new Error('Missing some validation constraints');
  }

  const minTitle = threadTitleConstraint.min.toNumber();
  const maxTitle = threadTitleConstraint.max.toNumber();
  const minText = postTextConstraint.min.toNumber();
  const maxText = postTextConstraint.max.toNumber();

  return Yup.object().shape({

    title: Yup.string()
      .min(minTitle, `Thread title is too short. Minimum length is ${minTitle} chars.`)
      .max(maxTitle, `Thread title is too long. Maximum length is ${maxTitle} chars.`)
      .required('Thread title is required'),

    text: Yup.string()
      .min(minText, `Thread text is too short. Minimum length is ${minText} chars.`)
      .max(maxText, `Thread text is too long. Maximum length is ${maxText} chars.`)
      .required('Thread text is required')
  });
};

type OuterProps = ValidationProps & {
  history?: History;
  id?: ThreadId;
  struct?: Thread;
  categoryId?: CategoryId;
};

type FormValues = {
  // pinned: boolean,
  title: string;
  text: string;
};

type FormProps = OuterProps & FormikProps<FormValues>;

const LabelledField = JoyForms.LabelledField<FormValues>();

const LabelledText = JoyForms.LabelledText<FormValues>();

const InnerForm = (props: FormProps) => {
  const {
    history,
    id,
    categoryId,
    struct,
    values,
    dirty,
    isValid,
    isSubmitting,
    setSubmitting,
    resetForm
  } = props;

  const {
    // pinned,
    title,
    text
  } = values;

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
    if (!history) return;

    // Get id of newly created thread:
    let _id = id;
    if (!_id) {
      _txResult.events.find(event => {
        const { event: { data, method } } = event;
        if (method === 'ThreadCreated') {
          _id = data.toArray()[0] as ThreadId;
        }
        return true;
      });
    }

    // Redirect to thread view:
    if (_id) {
      history.push('/forum/threads/' + _id.toString());
    }
  };

  if (!categoryId && !struct) {
    return (
      <Message error className='JoyMainStatus'>
        <Message.Header>Neither category id nor thread id is provided</Message.Header>
      </Message>
    );
  }

  const isNew = struct === undefined;
  const resolvedCategoryId = categoryId || (struct as Thread).category_id;

  const buildTxParams = () => {
    if (!isValid) return [];

    if (isNew) {
      return [
        resolvedCategoryId,
        new Text(title),
        new Text(text)
      ];
    } else {
      // NOTE: currently forum SRML doesn't support thread update.
      return [];
    }
  };

  // type CheckboxProps = FieldProps<FormValues> & SuiCheckboxProps;

  // const Checkbox = ({ field, form, ...props }: CheckboxProps) => {
  //   return (
  //     <SuiCheckbox
  //       {...props}
  //       {...field}
  //       toggle
  //       value='_ignore_value_'
  //       checked={field.value}
  //     />
  //   );
  // };

  const form =
    <Form className='ui form JoyForm EditEntityForm'>

      {/* TODO show pin toggle only if the current user is forum admin */}
      {/* NOTE: pin a thread is not yet supported by Forum SRML. */}
      {/* <LabelledField name='pinned' {...props}>
        <Field component={Checkbox} id='pinned' name='pinned' disabled={isSubmitting} label={`This thread is ${!pinned ? 'not' : '' } pinned`} />
      </LabelledField> */}

      <LabelledText name='title' placeholder={'Title'} {...props} />

      <LabelledField name='text' {...props}>
        <Field component='textarea' id='text' name='text' disabled={isSubmitting} rows={5} placeholder='Type here. You can use Markdown.' />
      </LabelledField>

      <LabelledField {...props}>
        <TxButton
          type='submit'
          size='large'
          label={isNew
            ? 'Create a thread'
            : 'Update a thread'
          }
          isDisabled={!dirty || isSubmitting}
          params={buildTxParams()}
          tx={isNew
            ? 'forum.createThread'
            : 'forum.updateThread'
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
    ? 'New thread'
    : 'Edit my thread';

  return <>
    <CategoryCrumbs categoryId={resolvedCategoryId} />
    <Section className='EditEntityBox' title={sectionTitle}>
      {form}
    </Section>
  </>;
};

const EditForm = withFormik<OuterProps, FormValues>({

  // Transform outer props into form values
  mapPropsToValues: props => {
    return {
      // pinned: struct && struct.pinned || false,
      title: '',
      text: ''
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
    return <em>Loading thread...</em>;
  }

  if (struct.isEmpty) {
    return <em>Thread not found</em>;
  }

  const isMyStruct = address === struct.author_id.toString();
  if (isMyStruct) {
    return <EditForm {...props} />;
  }

  return <Message error className='JoyMainStatus' header='You are not allowed edit this thread.' />;
}

function withCategoryIdFromUrl (Component: React.ComponentType<OuterProps>) {
  return function (props: UrlHasIdProps) {
    const { match: { params: { id } } } = props;
    try {
      return <Component {...props} categoryId={new CategoryId(id)} />;
    } catch (err) {
      return <em>Invalid category ID: {id}</em>;
    }
  };
}

function withIdFromUrl (Component: React.ComponentType<OuterProps>) {
  return function (props: UrlHasIdProps) {
    const { match: { params: { id } } } = props;
    try {
      return <Component {...props} id={new ThreadId(id)} />;
    } catch (err) {
      return <em>Invalid thread ID: {id}</em>;
    }
  };
}

export const NewThread = withMulti(
  EditForm,
  withOnlyMembers,
  withCategoryIdFromUrl,
  withThreadValidation
);

export const EditThread = withMulti(
  FormOrLoading,
  withOnlyMembers,
  withIdFromUrl,
  withThreadValidation,
  withForumCalls<OuterProps>(
    ['threadById', { paramName: 'id', propName: 'struct' }]
  )
);
