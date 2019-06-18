import React from 'react';
// import { Button, Checkbox as SuiCheckbox, CheckboxProps as SuiCheckboxProps, Message } from 'semantic-ui-react';
// import { Form, Field, FieldProps, withFormik, FormikProps } from 'formik';
import { Button, Message } from 'semantic-ui-react';
import { Form, Field, withFormik, FormikProps } from 'formik';
import * as Yup from 'yup';
import { History } from 'history';

import TxButton from '@polkadot/joy-utils/TxButton';
import { SubmittableResult } from '@polkadot/api';
import { withMulti } from '@polkadot/ui-api/with';

import * as JoyForms from '@polkadot/joy-utils/forms';
import { Text } from '@polkadot/types';
import { ThreadId, Thread, CategoryId } from '@joystream/types/forum';
import { withOnlyMembers } from '@polkadot/joy-utils/MyAccount';
import Section from '@polkadot/joy-utils/Section';
import { useMyAccount } from '@polkadot/joy-utils/MyAccountContext';
import { UrlHasIdProps, CategoryCrumbs } from './utils';
import { withForumCalls } from './calls';

const buildSchema = (p: ValidationProps) => Yup.object().shape({
  title: Yup.string()
    // .min(p.minTitleLen, `Thread title is too short. Minimum length is ${p.minTitleLen} chars.`)
    // .max(p.maxTitleLen, `Thread title is too long. Maximum length is ${p.maxTitleLen} chars.`)
    .required('Thread title is required'),
  text: Yup.string()
    // .min(p.minTextLen, `Thread description is too short. Minimum length is ${p.minTextLen} chars.`)
    // .max(p.maxTextLen, `Thread description is too long. Maximum length is ${p.maxTextLen} chars.`)
    .required('Thread text is required')
});

type ValidationProps = {
  // minTitleLen: number,
  // maxTitleLen: number,
  // minTextLen: number,
  // maxTextLen: number
};

type OuterProps = ValidationProps & {
  history?: History,
  id?: ThreadId
  struct?: Thread
  categoryId?: CategoryId
};

type FormValues = {
  // pinned: boolean,
  title: string,
  text: string
};

type FormProps = OuterProps & FormikProps<FormValues>;

const LabelledField = JoyForms.LabelledField<FormValues>();

const LabelledText = JoyForms.LabelledText<FormValues>();

const InnerForm = (props: FormProps) => {
  const {
    // history,
    // id,
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

  const onTxCancelled = () => {
    setSubmitting(false);
  };

  const onTxFailed = (_txResult: SubmittableResult) => {
    setSubmitting(false);
  };

  const onTxSuccess = (_txResult: SubmittableResult) => {
    setSubmitting(false);
    // TODO redirect to newly created thread. Get id from Substrate event.
    // goToView();
  };

  if (!categoryId && !struct) {
    return (
      <Message error className='JoyMainStatus'>
        <Message.Header>Neither category id nor thread id is provided</Message.Header>
      </Message>
    );
  }

  const isNew = struct === undefined;
  const resolvedCategoryId = categoryId ? categoryId : (struct as Thread).category_id;

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
      return [ /* TODO add all required params */ ];
    }
  };

  // const goToView = (id: ThreadId | number) => {
  //   if (history) {
  //     history.push('/forum/threads/' + id.toString());
  //   }
  // };

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

      <LabelledText name='title' placeholder={`Title`} {...props} />

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
          txCancelledCb={onTxCancelled}
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
  withCategoryIdFromUrl
);

export const EditThread = withMulti(
  FormOrLoading,
  withOnlyMembers,
  withIdFromUrl,
  withForumCalls<OuterProps>(
    ['threadById', { paramName: 'id', propName: 'struct' }]
  )
);
