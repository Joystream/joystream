import React from 'react';
import { Button, Tab, Dropdown } from 'semantic-ui-react';
import { Form, Field, withFormik, FormikProps } from 'formik';
import BN from 'bn.js';
import { History } from 'history';

import TxButton from '@polkadot/joy-utils/TxButton';
import { SubmittableResult } from '@polkadot/api';

import * as JoyForms from '@polkadot/joy-utils/forms';
import { Text } from '@polkadot/types';
import { Option } from '@polkadot/types/codec';
import { ContentId, ContentMetadata, ContentMetadataUpdate, SchemaId, ContentVisibility, VecContentId } from '@joystream/types/media';
import { onImageError, DEFAULT_THUMBNAIL_URL } from '../utils';
import { VideoValidationSchema } from '../schemas/video/Video';

const fakeFieldDescription = 'This is a description of the field';

function tooltip (_fieldName: keyof FormValues): string | undefined {
  return fakeFieldDescription; // TODO get real field description
}

// TODO get from verstore
const visibilityOptions = [
  'Public',
  'Unlisted'
].map(x => ({
  key: x, text: x, value: x,
}));

// TODO get from verstore
const languageOptions = [
  'English',
  'Chinese (Mandarin)',
  'Hindi',
  'Spanish',
  'Portuguese',
  'German',
  'Russian',
  'Japanese',
  'Norwegian'
].map(x => ({
  key: x, text: x, value: x,
}));

// TODO get from verstore
const categoryOptions = [
  'Film & Animation',
  'Autos & Vehicles',
  'Music',
  'Pets & Animals',
  'Sports',
  'Travel & Events',
  'Gaming',
  'People & Blogs',
  'Comedy',
  'News & Politics'
].map(x => ({
  key: x, text: x, value: x,
}));

// TODO get from verstore
const licenseOptions = [
  'Public Domain',
  'Share Alike',
  'No Derivatives',
  'No Commercial'
].map(x => ({
  key: x, text: x, value: x,
}));

type ValidationProps = {
  // minNameLen: number,
  // maxNameLen: number,
  // minDescLen: number,
  // maxDescLen: number,
  // maxThumbLen: number,
  // maxKeywordsLen: number
};

type OuterProps = ValidationProps & {
  isStorybook?: boolean,
  history?: History,
  contentId: ContentId,
  fileName?: string,
  metadataOpt?: Option<ContentMetadata>
};

type FormValues = {

  // Basic:
  name: string,
  description: string,
  thumbnail: string,
  keywords: string, // TODO need?
  visibility: string,
  playlist: string,

  // Additional:
  synopsis: string,
  creator: string,
  category: string,
  language: string,
  explicit: string,
  license: string,
};

type FormProps = OuterProps & FormikProps<FormValues>;

const LabelledField = JoyForms.LabelledField<FormValues>();

const LabelledText = JoyForms.LabelledText<FormValues>();

const InnerForm = (props: FormProps) => {
  const {
    isStorybook = false,
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

  const onTxCancelled = () => {

  };

  const onTxFailed = (txResult: SubmittableResult) => {
    setSubmitting(false);
    if (txResult == null) {
      return onTxCancelled();
    }
  };

  const onTxSuccess = (_txResult: SubmittableResult) => {
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
      json: new Option(Text, json)
    });

    return [ contentId, meta ];
  };

  const basicInfoTab = () => <Tab.Pane as='div'>
    <LabelledText name='name' label={`Name`} tooltip={tooltip('name')} {...props} />
    
    <LabelledText name='thumbnail' label={`Thumbnail image URL`} tooltip={tooltip('thumbnail')} {...props} />
    
    <LabelledField name='description' label={`Description`} tooltip={tooltip('description')} {...props}>
      <Field component='textarea' id='description' name='description' disabled={isSubmitting} rows={3} />
    </LabelledField>

    {/* <LabelledText name='keywords' label={`Keywords`} tooltip={tooltip('keywords')} placeholder={`Comma-separated keywords`} {...props} /> */}

    <LabelledField name='visibility' label={`Visibility`} tooltip={tooltip('visibility')} {...props}>
      <Field component={Dropdown} id='visibility' name='visibility' disabled={isSubmitting} selection options={visibilityOptions} />
    </LabelledField>
    
  </Tab.Pane>

  const additionalTab = () => <Tab.Pane as='div'>
    <LabelledField name='synopsis' label={`Synopsis`} tooltip={tooltip('synopsis')} {...props}>
      <Field component='textarea' id='synopsis' name='synopsis' disabled={isSubmitting} rows={3} />
    </LabelledField>

    <LabelledText name='creator' label={`Creator`} tooltip={tooltip('creator')} {...props} />

    <LabelledField name='category' label={`Category`} tooltip={tooltip('category')} {...props}>
      <Field component={Dropdown} id='category' name='category' disabled={isSubmitting} search selection options={categoryOptions} />
    </LabelledField>

    <LabelledField name='language' label={`Language`} tooltip={tooltip('language')} {...props}>
      <Field component={Dropdown} id='language' name='language' disabled={isSubmitting} search selection options={languageOptions} />
    </LabelledField>

    <LabelledField name='license' label={`License`} tooltip={tooltip('license')} {...props}>
      <Field component={Dropdown} id='license' name='license' disabled={isSubmitting} search selection options={licenseOptions} />
    </LabelledField>
  </Tab.Pane>

  const tabs = () => <Tab
    menu={{ secondary: true, pointing: true, color: 'blue' }}
    panes={[
      { menuItem: 'Basic info', render: basicInfoTab },
      { menuItem: 'Additional', render: additionalTab },
    ]}
  />;

  const MainButton = () => {
    const isDisabled = !dirty || isSubmitting;

    const label = isNew
      ? 'Publish'
      : 'Update';

    if (isStorybook) return (
      <Button
        primary
        type='button'
        size='large'
        disabled={isDisabled}
        content={label}
      />
    );

    return <TxButton
      type='submit'
      size='large'
      isDisabled={isDisabled}
      label={label}
      params={buildTxParams()}
      tx={isNew
        ? 'dataDirectory.addMetadata'
        : 'dataDirectory.updateMetadata'
      }
      onClick={onSubmit}
      txFailedCb={onTxFailed}
      txSuccessCb={onTxSuccess}
    />
  }

  return <div className='EditMetaBox'>
    <div className='EditMetaThumb'>
      {thumbnail && <img src={thumbnail} onError={onImageError} />}
    </div>

    <Form className='ui form JoyForm EditMetaForm'>
      
      {tabs()}

      {/* TODO add metadata status dropdown: Draft, Published */}

      <LabelledField style={{ marginTop: '1rem' }} {...props}>
        <MainButton />
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

export const EditForm = withFormik<OuterProps, FormValues>({

  // Transform outer props into form values
  mapPropsToValues: props => {
    const { metadataOpt, fileName } = props;
    const meta = metadataOpt ? metadataOpt.unwrapOr(undefined) : undefined;
    const json = meta ? meta.parseJson() : undefined;

    return {
      // Basic:
      name: json && json.name || fileName || '',
      description: json && json.description || '',
      thumbnail: json && json.thumbnail || DEFAULT_THUMBNAIL_URL,
      keywords: json && json.keywords || '',
      visibility: visibilityOptions[0].value,
      playlist: '',

      // Additional:
      synopsis: '',
      creator: '',
      category: categoryOptions[0].value,
      language: languageOptions[0].value,
      explicit: '',// TODO explicitOptions[0].value,
      license: licenseOptions[0].value,
    };
  },

  validationSchema: () => VideoValidationSchema,

  handleSubmit: () => {
    // do submitting things
  }
})(InnerForm);

export default EditForm;
