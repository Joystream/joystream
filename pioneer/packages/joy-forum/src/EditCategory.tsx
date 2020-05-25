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
import { Option } from '@polkadot/types/codec';
import { CategoryId, Category } from '@joystream/types/lib/forum';
import Section from '@polkadot/joy-utils/Section';
import { useMyAccount } from '@polkadot/joy-utils/MyAccountContext';
import { UrlHasIdProps, CategoryCrumbs } from './utils';
import { withOnlyForumSudo } from './ForumSudo';
import { withForumCalls } from './calls';
import { ValidationProps, withCategoryValidation } from './validation';
import { TxFailedCallback, TxCallback } from '@polkadot/react-components/Status/types';

const buildSchema = (props: ValidationProps) => {
  const {
    categoryTitleConstraint,
    categoryDescriptionConstraint
  } = props;

  if (!categoryTitleConstraint || !categoryDescriptionConstraint) {
    throw new Error('Missing some validation constraints');
  }

  const minTitle = categoryTitleConstraint.min.toNumber();
  const maxTitle = categoryTitleConstraint.max.toNumber();
  const minDescr = categoryDescriptionConstraint.min.toNumber();
  const maxDescr = categoryDescriptionConstraint.max.toNumber();

  return Yup.object().shape({

    title: Yup.string()
      .min(minTitle, `Category title is too short. Minimum length is ${minTitle} chars.`)
      .max(maxTitle, `Category title is too long. Maximum length is ${maxTitle} chars.`)
      .required('Category title is required'),

    description: Yup.string()
      .min(minDescr, `Category description is too short. Minimum length is ${minDescr} chars.`)
      .max(maxDescr, `Category description is too long. Maximum length is ${maxDescr} chars.`)
      .required('Category description is required')
  });
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

  const onTxFailed: TxFailedCallback = (txResult: SubmittableResult | null) => {
    setSubmitting(false);
    if (txResult == null) {
      // Tx cancelled.
      return;
    }
  };

  const onTxSuccess: TxCallback = (_txResult: SubmittableResult) => {
    setSubmitting(false);
    if (!history) return;

    // Get id of newly created category:
    let _id = id;
    if (!_id) {
      _txResult.events.find(event => {
        const { event: { data, method } } = event;
        if (method === 'CategoryCreated') {
          _id = data.toArray()[0] as CategoryId;
        }
        return true;
      });
    }

    // Redirect to category view:
    if (_id) {
      history.push('/forum/categories/' + _id.toString());
    }
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

function NewSubcategoryForm (props: UrlHasIdProps & OuterProps) {
  const { match: { params: { id } } } = props;
  try {
    return <EditForm {...props} parentId={new CategoryId(id)} />;
  } catch (err) {
    return <em>Invalid parent category id: {id}</em>;
  }
}

export const NewCategory = withMulti(
  EditForm,
  withOnlyForumSudo,
  withCategoryValidation
);

export const NewSubcategory = withMulti(
  NewSubcategoryForm,
  withOnlyForumSudo,
  withCategoryValidation
);

export const EditCategory = withMulti(
  FormOrLoading,
  withOnlyForumSudo,
  withIdFromUrl,
  withCategoryValidation,
  withForumCalls<OuterProps>(
    ['categoryById', { paramName: 'id', propName: 'struct' }]
  )
);
