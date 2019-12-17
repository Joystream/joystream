import React from 'react';
import { Button, Tab, Dropdown } from 'semantic-ui-react';
import { Form, Field, withFormik, FormikProps } from 'formik';
import { History } from 'history';

import TxButton from '@polkadot/joy-utils/TxButton';
import { SubmittableResult } from '@polkadot/api';

import * as JoyForms from '@polkadot/joy-utils/forms';
import { Option } from '@polkadot/types/codec';
import { ContentId, ContentMetadata } from '@joystream/types/media';
import { onImageError, DEFAULT_THUMBNAIL_URL } from '../utils';
import { VideoValidationSchema, VideoType, VideoClass, /* VideoPropNames, VideoPropDescriptions */ } from '../schemas/video/Video';

export type VideoPropId = keyof VideoType;

type PropIdToStringMapping = {
  [_ in VideoPropId]: string;
}

export const VideoPropIds = {} as PropIdToStringMapping;
export const VideoPropNames = {} as PropIdToStringMapping;
export const VideoPropDescriptions = {} as PropIdToStringMapping;

Object.keys(VideoClass).map(x => {
  const id = x as VideoPropId
  const prop = VideoClass[id];
  VideoPropIds[id] = id;
  VideoPropNames[id] = prop.name;
  VideoPropDescriptions[id] = prop.description;
});

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

type OuterProps = {
  isStorybook?: boolean,
  history?: History,
  contentId: ContentId,
  fileName?: string,
  metadataOpt?: Option<ContentMetadata>
};

const FormLabels = VideoPropNames;

const FormTooltips = VideoPropDescriptions;

type FormValues = VideoType;

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

  const { videoThumbnail } = values;

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

    return [ /* TODO save entity to versioned store */ ];
  };

  const basicInfoTab = () => <Tab.Pane as='div'>
    <LabelledText name='title' label={fieldName('title')} tooltip={tooltip('title')} {...props} />
    
    <LabelledText name='videoThumbnail' label={fieldName('videoThumbnail')} tooltip={tooltip('videoThumbnail')} {...props} />
    
    <LabelledField name='description' label={fieldName('description')} tooltip={tooltip('description')} {...props}>
      <Field component='textarea' id='description' name='description' disabled={isSubmitting} rows={3} />
    </LabelledField>

    {/* <LabelledText name='keywords' label={fieldName(`Keywords`)} tooltip={tooltip('keywords')} placeholder={`Comma-separated keywords`} {...props} /> */}

    <LabelledField name='publicationStatus' label={fieldName('publicationStatus')} tooltip={tooltip('publicationStatus')} {...props}>
      <Field component={Dropdown} id='publicationStatus' name='publicationStatus' disabled={isSubmitting} selection options={visibilityOptions} />
    </LabelledField>
    
  </Tab.Pane>

  const additionalTab = () => <Tab.Pane as='div'>
    <LabelledField name='aboutTheVideo' label={fieldName('aboutTheVideo')} tooltip={tooltip('aboutTheVideo')} {...props}>
      <Field component='textarea' id='aboutTheVideo' name='aboutTheVideo' disabled={isSubmitting} rows={3} />
    </LabelledField>

    <LabelledField name='category' label={fieldName('category')} tooltip={tooltip('category')} {...props}>
      <Field component={Dropdown} id='category' name='category' disabled={isSubmitting} search selection options={categoryOptions} />
    </LabelledField>

    <LabelledField name='language' label={fieldName('language')} tooltip={tooltip('language')} {...props}>
      <Field component={Dropdown} id='language' name='language' disabled={isSubmitting} search selection options={languageOptions} />
    </LabelledField>

    <LabelledField name='license' label={fieldName('license')} tooltip={tooltip('license')} {...props}>
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
      {videoThumbnail && <img src={videoThumbnail} onError={onImageError} />}
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
    const { entity: json, fileName } = props;

    return {
      // Basic:
      title: json && json.title || fileName || '',
      description: json && json.description || '',
      videoThumbnail: json && json.videoThumbnail || DEFAULT_THUMBNAIL_URL,
      keywords: json && json.keywords || '',
      publicationStatus: visibilityOptions[0].value,
      playlist: '',

      // Additional:
      aboutTheVideo: '',
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
