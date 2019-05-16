import React from 'react';
import { Button, Message } from 'semantic-ui-react';
import { Form, Field, withFormik, FormikProps } from 'formik';
import * as Yup from 'yup';

import TxButton from '@polkadot/joy-utils/TxButton';
import { SubmittableResult } from '@polkadot/api';
import { /* withCalls, */ withMulti } from '@polkadot/ui-api/with';

import * as JoyForms from '@polkadot/joy-utils/forms';
import { AccountId, Text, Bool } from '@polkadot/types';
import { Option, Vector } from '@polkadot/types/codec';
import { CategoryId, Category } from './types';
import { withOnlyMembers } from '@polkadot/joy-utils/MyAccount';
import Section from '@polkadot/joy-utils/Section';
import { useMyAccount } from '@polkadot/joy-utils/MyAccountContext';
import { useForum } from './Context';
import { UrlHasIdProps, CategoryCrumbs } from './utils';

const buildSchema = (p: ValidationProps) => Yup.object().shape({
  name: Yup.string()
    // .min(p.minNameLen, `Category name is too short. Minimum length is ${p.minNameLen} chars.`)
    // .max(p.maxNameLen, `Category name is too long. Maximum length is ${p.maxNameLen} chars.`)
    .required('Category name is required'),
  text: Yup.string()
    // .min(p.minTextLen, `Category description is too short. Minimum length is ${p.minTextLen} chars.`)
    // .max(p.maxTextLen, `Category description is too long. Maximum length is ${p.maxTextLen} chars.`)
});

type ValidationProps = {
  // minNameLen: number,
  // maxNameLen: number,
  // minTextLen: number,
  // maxTextLen: number
};

type OuterProps = ValidationProps & {
  id?: CategoryId
  struct?: Category
};

type FormValues = {
  parentId?: string,
  name: string,
  text: string
};

type FormProps = OuterProps & FormikProps<FormValues>;

const LabelledField = JoyForms.LabelledField<FormValues>();

const LabelledText = JoyForms.LabelledText<FormValues>();

const InnerForm = (props: FormProps) => {
  const {
    id,
    struct,
    values,
    dirty,
    isValid,
    isSubmitting,
    setSubmitting,
    resetForm
  } = props;

  const {
    parentId,
    name,
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
  const resolvedParentId = !parentId && struct ? struct.parent_id : parentId;

  const buildTxParams = () => {
    if (!isValid) return [];

    if (isNew) {
      return [ id /* TODO add all required params */ ];
    } else {
      return [ /* TODO add all required params */ ];
    }
  };

  const updateForumContext = () => {
    const category = new Category({
      owner: new AccountId(address),
      parent_id: new Option(CategoryId, resolvedParentId),
      children_ids: new Vector(CategoryId, []),
      locked: new Bool(false), // TODO update from the form.
      name: new Text(name),
      text: new Text(text)
    });
    if (id) {
      dispatch({ type: 'UpdateCategory', category, id: id.toNumber() });
    } else {
      dispatch({ type: 'NewCategory', category });
    }
  };

  const form =
    <Form className='ui form JoyForm EditEntityForm'>

      { /* TODO show dropdown with top categories and select parentId if defined. */}

      <LabelledText name='name' placeholder={`Name your category`} {...props} />

      <LabelledField name='text' {...props}>
        <Field component='textarea' id='text' name='text' disabled={isSubmitting} rows={3} placeholder='Describe your category. You can use Markdown.' />
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
            ? 'Create a category'
            : 'Update a category'
          }
        />

        <TxButton
          style={{ display: 'none' }} // TODO delete once integrated w/ substrate
          type='submit'
          size='large'
          label={isNew
            ? 'Create a category'
            : 'Update a category'
          }
          isDisabled={!dirty || isSubmitting}
          params={buildTxParams()}
          tx={isNew
            ? 'forum.newCategory'
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

  const parentCategoryId = resolvedParentId ? new CategoryId(resolvedParentId) : undefined;

  const sectionTitle = isNew
    ? 'New category'
    : 'Edit my category';

  return <>
    <CategoryCrumbs categoryId={parentCategoryId} />
    <Section className='EditEntityBox' title={sectionTitle}>
      {form}
    </Section>
  </>;
};

const EditForm = withFormik<OuterProps, FormValues>({

  // Transform outer props into form values
  mapPropsToValues: props => {
    const { struct } = props;

    const parentId = (struct && struct.parent_id)
      ? struct.parent_id.toHex()
      : undefined;

    return {
      parentId: parentId,
      name: struct && struct.name || '',
      text: struct && struct.text || ''
    };
  },

  validationSchema: buildSchema,

  handleSubmit: values => {
    // do submitting things
  }
})(InnerForm);

type LoadStructProps = OuterProps & {
  structOpt: Option<Category>
};

function FormOrLoading (props: LoadStructProps) {
  const { state: { address } } = useMyAccount();
  const { structOpt } = props;

  if (!address || !structOpt) {
    return <em>Loading category...</em>;
  }

  if (structOpt.isNone) {
    return <em>Category not found</em>;
  }

  const struct = structOpt.unwrap();
  const isMyStruct = address === struct.owner.toString();

  if (isMyStruct) {
    return <EditForm {...props} struct={struct} />;
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

// TODO delete once integrated w/ Substrate's state:
function withLoadStruct (Component: React.ComponentType<OuterProps & LoadStructProps>) {
  return function (props: OuterProps) {
    const { id } = props;
    if (!id) {
      throw new Error('This component requires an id');
    }

    const { state: { categoryById } } = useForum();
    const category = categoryById.get(id.toNumber());
    const structOpt: Option<Category> = new Option(Category, category);

    return <Component {...props} structOpt={structOpt} />;
  };
}

export const NewCategory = EditForm;

export const EditCategory = withMulti(
  FormOrLoading,
  withOnlyMembers, // TODO change to: withOnlySudo
  withIdFromUrl,
  withLoadStruct

  // TODO Get category struct from Substrate:
  // , withCalls<OuterProps>(
  //   ['query.forum.categoryById',
  //     { paramName: 'id', propName: 'structOpt' } ]
  // )
);
