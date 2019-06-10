import React from 'react';
import { Button, Message } from 'semantic-ui-react';
import { Form, Field, withFormik, FormikProps } from 'formik';
import * as Yup from 'yup';
import { History } from 'history';

import TxButton from '@polkadot/joy-utils/TxButton';
import { SubmittableResult } from '@polkadot/api';
import { withMulti } from '@polkadot/ui-api/with';

import * as JoyForms from '@polkadot/joy-utils/forms';
import { Text } from '@polkadot/types';
import { Option } from '@polkadot/types/codec';
import { CategoryId, Category } from './types';
import Section from '@polkadot/joy-utils/Section';
import { useMyAccount } from '@polkadot/joy-utils/MyAccountContext';
import { UrlHasIdProps, CategoryCrumbs } from './utils';
import { withOnlyForumSudo } from './ForumSudo';
import { withForumCalls } from './calls';

const buildSchema = (p: ValidationProps) => Yup.object().shape({
  title: Yup.string()
    // .min(p.minTitleLen, `Category title is too short. Minimum length is ${p.minTitleLen} chars.`)
    // .max(p.maxTitleLen, `Category title is too long. Maximum length is ${p.maxTitleLen} chars.`)
    .required('Category title is required'),
  description: Yup.string()
    // .min(p.minDescriptionLen, `Category description is too short. Minimum length is ${p.minDescriptionLen} chars.`)
    // .max(p.maxDescriptionLen, `Category description is too long. Maximum length is ${p.maxDescriptionLen} chars.`)
    .required('Category description is required'),
});

type ValidationProps = {
  // minTitleLen: number,
  // maxTitleLen: number,
  // minDescriptionLen: number,
  // maxDescriptionLen: number
};

type OuterProps = ValidationProps & {
  history?: History,
  id?: CategoryId,
  parentId?: CategoryId,
  struct?: Category
};

type FormValues = {
  title: string,
  description: string
};

type FormProps = OuterProps & FormikProps<FormValues>;

const LabelledField = JoyForms.LabelledField<FormValues>();

const LabelledText = JoyForms.LabelledText<FormValues>();

const InnerForm = (props: FormProps) => {
  const {
    history,
    id,
    parentId,
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
    description
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
    // TODO redirect to newly created category. Get id from Substrate event.
    // goToView(id);
  };

  const isNew = struct === undefined;
  const isSubcategory = parentId !== undefined;

  const buildTxParams = () => {
    if (!isValid) return [];

    if (isNew) {
      return [
        new Option(CategoryId, parentId),
        new Text(title),
        new Text(description)
      ];
    } else {
      // NOTE: currently update_category doesn't support title and description updates.
      return [ /* TODO add all required params */ ];
    }
  };

  // const goToView = (id: CategoryId | number) => {
  //   if (history) {
  //     history.push('/forum/categories/' + id.toString());
  //   }
  // };

  const categoryWord = isSubcategory ? `subcategory` : `category`;

  const form =
    <Form className='ui form JoyForm EditEntityForm'>

      <LabelledText name='title' placeholder={`Name your ${categoryWord}`} {...props} />

      <LabelledField name='description' {...props}>
        <Field component='textarea' id='description' name='description' disabled={isSubmitting} rows={3} placeholder={`Describe your ${categoryWord}. You can use Markdown.`} />
      </LabelledField>

      <LabelledField {...props}>
        <TxButton
          type='submit'
          size='large'
          label={isNew
            ? `Create a ${categoryWord}`
            : `Update a category`
          }
          isDisabled={!dirty || isSubmitting}
          params={buildTxParams()}
          tx={isNew
            ? 'forum.createCategory'
            : 'forum.updateCategory'
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
    ? `New ${categoryWord}`
    : `Edit my ${categoryWord}`;

  return <>
    <CategoryCrumbs categoryId={parentId} />
    <Section className='EditEntityBox' title={sectionTitle}>
      {form}
    </Section>
  </>;
};

const EditForm = withFormik<OuterProps, FormValues>({

  // Transform outer props into form values
  mapPropsToValues: props => {
    const { parentId, struct } = props;

    return {
      parentId: struct ? struct.parent_id : parentId,
      title: struct ? struct.title : '',
      description: struct ? struct.description : ''
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
    return <em>Loading category...</em>;
  }

  if (struct.isEmpty) {
    return <em>Category not found</em>;
  }

  const isMyStruct = address === struct.moderator_id.toString();
  if (isMyStruct) {
    return <EditForm {...props} />;
  }

  return <Message error className='JoyMainStatus' header='You are not allowed edit this category.' />;
}

function withIdFromUrl (Component: React.ComponentType<OuterProps>) {
  return function (props: UrlHasIdProps) {
    const { match: { params: { id } } } = props;
    try {
      return <Component id={new CategoryId(id)} />;
    } catch (err) {
      return <em>Invalid category ID: {id}</em>;
    }
  };
}

function NewSubcategoryForm (props: UrlHasIdProps) {
  const { match: { params: { id } } } = props;
  try {
    return <EditForm parentId={new CategoryId(id)} />;
  } catch (err) {
    return <em>Invalid parent category id: {id}</em>;
  }
}

export const NewCategory = withMulti(
  EditForm,
  withOnlyForumSudo
);

export const NewSubcategory = withMulti(
  NewSubcategoryForm,
  withOnlyForumSudo
);

export const EditCategory = withMulti(
  FormOrLoading,
  withOnlyForumSudo,
  withIdFromUrl,
  withForumCalls<OuterProps>(
    ['categoryById', { paramName: 'id', propName: 'struct' }]
  )
);
