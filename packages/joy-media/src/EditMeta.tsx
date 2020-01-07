import React from 'react';
import { Button, Message } from 'semantic-ui-react';
import { Form, Field, withFormik, FormikProps } from 'formik';
import * as Yup from 'yup';
import BN from 'bn.js';
import { History } from 'history';

import TxButton from '@polkadot/joy-utils/TxButton';
import { SubmittableResult } from '@polkadot/api';
import { withCalls, withMulti } from '@polkadot/react-api/with';

import * as JoyForms from '@polkadot/joy-utils/forms';
import { Option } from '@polkadot/types/codec';
import { ContentId, ContentMetadata, ContentMetadataUpdate, SchemaId, ContentVisibility, VecContentId } from '@joystream/types/media';
import { OptionText } from '@joystream/types/';
import { withOnlyMembers } from '@polkadot/joy-utils/MyAccount';
import Section from '@polkadot/joy-utils/Section';
import { onImageError, DEFAULT_THUMBNAIL_URL } from './utils';
import { useMyAccount } from '@polkadot/joy-utils/MyAccountContext';
import { TxFailedCallback, TxCallback } from '@polkadot/react-components/Status/types';

const buildSchema = (p: ValidationProps) => Yup.object().shape({
  name: Yup.string()
    // .min(p.minNameLen, `Name is too short. Minimum length is ${p.minNameLen} chars.`)
    // .max(p.maxNameLen, `Name is too long. Maximum length is ${p.maxNameLen} chars.`)
    .required('Name is required'),
  description: Yup.string()
    // .min(p.minDescLen, `Description is too short. Minimum length is ${p.minDescLen} chars.`)
    // .max(p.maxDescLen, `Description is too long. Maximum length is ${p.maxDescLen} chars.`)
    ,
  thumbnail: Yup.string()
    // .max(p.maxThumbLen, `Name is too long. Maximum length is ${p.maxThumbLen} chars.`)
    .url('Thumbnail must be a valid URL of an image.')
    .required('Thumbnail is required'),
  keywords: Yup.string()
    // .max(p.maxKeywordsLen, `Keywords are too long. Maximum length is ${p.maxKeywordsLen} chars.`)
});

type ValidationProps = {
  // minNameLen: number,
  // maxNameLen: number,
  // minDescLen: number,
  // maxDescLen: number,
  // maxThumbLen: number,
  // maxKeywordsLen: number
};

type OuterProps = ValidationProps & {
  history?: History,
  contentId: ContentId,
  fileName?: string,
  metadataOpt?: Option<ContentMetadata>
};

type FormValues = {
  name: string,
  description: string,
  thumbnail: string,
  keywords: string
};

type FormProps = OuterProps & FormikProps<FormValues>;

const LabelledField = JoyForms.LabelledField<FormValues>();

const LabelledText = JoyForms.LabelledText<FormValues>();

const InnerForm = (props: FormProps) => {
  const {
    history,
    contentId,
    metadataOpt,
    values,
    dirty,
    isValid,
    isSubmitting,
    setSubmitting,
    resetForm
  } = props;

  const {
    name,
    description,
    thumbnail,
    keywords
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
    goToPlayerPage();
  };

  const goToPlayerPage = () => {
    if (history) {
      history.push('/media/play/' + contentId.encode());
    }
  };

  const isNew = !metadataOpt || metadataOpt.isNone;

  const buildTxParams = () => {
    if (!isValid) return [];

    const json = JSON.stringify({
      name,
      description,
      thumbnail,
      keywords
    });

    // TODO set Option.some only on changed fields && if json has changed fields
    const meta = new ContentMetadataUpdate({
      children_ids: new Option(VecContentId, null),
      visibility: new Option(ContentVisibility, 'Draft'),
      schema: new Option(SchemaId, new BN(1)),
      json: OptionText.some(json)
    });

    return [ contentId, meta ];
  };

  return <div className='EditMetaBox'>
    <div className='EditMetaThumb'>
      {thumbnail && <img src={thumbnail} onError={onImageError} />}
    </div>
    <Form className='ui form JoyForm EditMetaForm'>
      <LabelledText name='name' placeholder={`Name`} {...props} />
      <LabelledField name='description' {...props}>
        <Field component='textarea' id='description' name='description' disabled={isSubmitting} rows={3} placeholder='Description' />
      </LabelledField>
      <LabelledText name='thumbnail' placeholder={`Thumbnail image URL`} {...props} />
      <LabelledText name='keywords' placeholder={`Comma-separated keywords`} {...props} />

      {/* TODO add metadata status dropdown: Draft, Published */}

      <LabelledField {...props}>
        <TxButton
          type='submit'
          size='large'
          label={isNew
            ? 'Publish'
            : 'Update'
          }
          isDisabled={!dirty || isSubmitting}
          params={buildTxParams()}
          tx={isNew
            ? 'dataDirectory.addMetadata'
            : 'dataDirectory.updateMetadata'
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
    </Form>
  </div>;
};

const EditForm = withFormik<OuterProps, FormValues>({

  // Transform outer props into form values
  mapPropsToValues: props => {
    const { metadataOpt, fileName } = props;
    const meta = metadataOpt ? metadataOpt.unwrapOr(undefined) : undefined;
    const json = meta ? meta.parseJson() : undefined;

    return {
      name: json && json.name || fileName || '',
      description: json && json.description || '',
      thumbnail: json && json.thumbnail || DEFAULT_THUMBNAIL_URL,
      keywords: json && json.keywords || ''
    };
  },

  validationSchema: buildSchema,

  handleSubmit: values => {
    // do submitting things
  }
})(InnerForm);

function FormOrLoading (props: OuterProps) {
  const { state: { address } } = useMyAccount();
  const { metadataOpt } = props;

  if (!address || !metadataOpt) {
    return <em>Loading...</em>;
  }

  const isMyContent =
    metadataOpt && metadataOpt.isSome &&
    address === metadataOpt.unwrap().owner.toString();

  if (isMyContent) {
    return (
      <Section title='Edit my upload'>
        <EditForm {...props} />
      </Section>
    );
  }

  return <Message error className='JoyMainStatus' header='You are not allowed edit this content.' />;
}

export const EditByContentId = withMulti(
  FormOrLoading,
  withOnlyMembers,
  withGetContentIdFromUrl,
  withCalls<OuterProps>(
    ['query.dataDirectory.metadataByContentId',
      { paramName: 'contentId', propName: 'metadataOpt' } ]
  )
);

type UrlHasContentIdProps = {
  match: {
    params: {
      assetName: string
    }
  }
};

function withGetContentIdFromUrl (Component: React.ComponentType<OuterProps>) {
  return function (props: UrlHasContentIdProps) {
    const { match: { params: { assetName } } } = props;
    try {
      const contentId = ContentId.decode(assetName);
      return <Component contentId={contentId} {...props} />;
    } catch (err) {
      return <em>Invalid content ID: {assetName}</em>;
    }
  };
}

export default EditForm;
