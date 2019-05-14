import React from 'react';
import { Button, Message } from 'semantic-ui-react';
import { Form, Field, withFormik, FormikProps } from 'formik';
import * as Yup from 'yup';

import TxButton from '@polkadot/joy-utils/TxButton';
import { SubmittableResult } from '@polkadot/api';
import { /* withCalls, */ withMulti } from '@polkadot/ui-api/with';

import * as JoyForms from '@polkadot/joy-utils/forms';
import { AccountId, Text, Bool } from '@polkadot/types';
import { Option } from '@polkadot/types/codec';
import { ThreadId, Thread, CategoryId } from './types';
import { withOnlyMembers } from '@polkadot/joy-utils/MyAccount';
import Section from '@polkadot/joy-utils/Section';
import { useMyAccount } from '@polkadot/joy-utils/MyAccountContext';
import { useForum } from './Context';
import { UrlHasIdProps } from './utils';

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
  id?: ThreadId
  struct?: Thread
  categoryId?: CategoryId
};

type FormValues = {
  title: string,
  text: string
};

type FormProps = OuterProps & FormikProps<FormValues>;

const LabelledField = JoyForms.LabelledField<FormValues>();

const LabelledText = JoyForms.LabelledText<FormValues>();

const InnerForm = (props: FormProps) => {
  const {
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
    title,
    text
  } = values;

  const { state: { address } } = useMyAccount();
  const { dispatch } = useForum();

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
  };

  const isNew = struct === undefined;

  const buildTxParams = () => {
    if (!isValid) return [];

    if (isNew) {
      return [ id /* TODO add all required params */ ];
    } else {
      return [ /* TODO add all required params */ ];
    }
  };

  const updateForumContext = () => {
    const thread = new Thread({
      owner: struct ? struct.owner : new AccountId(address),
      category_id: !categoryId && struct ? struct.category_id : categoryId,
      locked: new Bool(false), // TODO update from the form.
      title: new Text(title),
      text: new Text(text)
    });
    if (id) {
      dispatch({ type: 'UpdateThread', thread, id: id.toNumber() });
    } else {
      dispatch({ type: 'NewThread', thread });
    }
  };

  const sectionTitle = isNew
    ? 'New thread'
    : 'Edit my thread';

  return <Section className='EditEntityBox' title={sectionTitle}>
    <Form className='ui form JoyForm EditEntityForm'>

      <LabelledText name='title' placeholder={`Title`} {...props} />

      <LabelledField name='text' {...props}>
        <Field component='textarea' id='text' name='text' disabled={isSubmitting} rows={5} placeholder='Type here. You can use Markdown.' />
      </LabelledField>

      <LabelledField {...props}>

        { /* TODO delete this button once integrated w/ substrate */ }
        <Button
          type='button'
          size='large'
          primary
          disabled={!dirty || isSubmitting}
          onClick={updateForumContext}
          content={isNew
            ? 'Create a thread'
            : 'Update a thread'
          }
        />

        <TxButton
          style={{ display: 'none' }} // TODO delete once integrated w/ substrate
          type='submit'
          size='large'
          label={isNew
            ? 'Create a thread'
            : 'Update a thread'
          }
          isDisabled={!dirty || isSubmitting}
          params={buildTxParams()}
          tx={isNew
            ? 'forum.newThread'
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
    </Form>
  </Section>;
};

const EditForm = withFormik<OuterProps, FormValues>({

  // Transform outer props into form values
  mapPropsToValues: props => {
    const { struct } = props;
    return {
      title: struct && struct.title || '',
      text: struct && struct.text || ''
    };
  },

  validationSchema: buildSchema,

  handleSubmit: values => {
    // do submitting things
  }
})(InnerForm);

type LoadStructProps = OuterProps & {
  structOpt: Option<Thread>
};

function FormOrLoading (props: LoadStructProps) {
  const { state: { address } } = useMyAccount();
  const { structOpt } = props;

  if (!address || !structOpt) {
    return <em>Loading thread...</em>;
  }

  if (structOpt.isNone) {
    return <em>Thread not found</em>;
  }

  const struct = structOpt.unwrap();
  const isMyStruct = address === struct.owner.toString();

  if (isMyStruct) {
    return <EditForm {...props} struct={struct} />;
  }

  return <Message error className='JoyMainStatus' header='You are not allowed edit this thread.' />;
}

function withCategoryIdFromUrl (Component: React.ComponentType<OuterProps>) {
  return function (props: UrlHasIdProps) {
    const { match: { params: { id } } } = props;
    try {
      return <Component categoryId={new CategoryId(id)} />;
    } catch (err) {
      return <em>Invalid category ID: {id}</em>;
    }
  };
}

function withIdFromUrl (Component: React.ComponentType<OuterProps>) {
  return function (props: UrlHasIdProps) {
    const { match: { params: { id } } } = props;
    try {
      return <Component id={new ThreadId(id)} />;
    } catch (err) {
      return <em>Invalid thread ID: {id}</em>;
    }
  };
}

// TODO delete once integrated w/ Substrate's state:
function withLoadStruct (Component: React.ComponentType<OuterProps & LoadStructProps>) {
  return function (props: OuterProps) {
    const { id } = props;
    if (!id) {
      throw new Error('This component requires an id');
    }

    const { state: { threadById } } = useForum();
    const thread = threadById.get(id.toNumber());
    const structOpt: Option<Thread> = new Option(Thread, thread);

    return <Component {...props} structOpt={structOpt} />;
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
  withLoadStruct

  // TODO Get thread struct from Substrate:
  // , withCalls<OuterProps>(
  //   ['query.forum.threadById',
  //     { paramName: 'id', propName: 'structOpt' } ]
  // )
);
