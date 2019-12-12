import React from 'react';
import { Button, Tab, Dropdown } from 'semantic-ui-react';
import { Form, Field, withFormik, FormikProps } from 'formik';
import { History } from 'history';

import TxButton from '@polkadot/joy-utils/TxButton';
import { SubmittableResult } from '@polkadot/api';

import * as JoyForms from '@polkadot/joy-utils/forms';
import { ContentId } from '@joystream/types/media';
import { onImageError, DEFAULT_THUMBNAIL_URL } from '../utils';
import { MusicTrackValidationSchema, MusicTrackType, MusicTrackClass } from '../schemas/music/MusicTrack';

function fieldName (_fieldName: keyof FormValues): string | undefined {
  const field = MusicTrackClass[_fieldName];
  return field ? field.name : undefined;
}

function tooltip (_fieldName: keyof FormValues): string | undefined {
  const field = MusicTrackClass[_fieldName];
  return field ? field.description : undefined;
}

// TODO get from verstore
const visibilityOptions = [
  'Public',
  'Unlisted'
].map(x => ({
  key: x, text: x, value: x,
}));

// TODO get from verstore
const genreOptions = [
  'Classical Music',
  'Metal',
  'Rock',
  'Rap',
  'Techno',
].map(x => ({
  key: x, text: x, value: x,
}));

// TODO get from verstore
const moodOptions = [
  'Relaxing',
].map(x => ({
  key: x, text: x, value: x,
}));

// TODO get from verstore
const themeOptions = [
  'Dark',
  'Light',
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
  // minTitleLen: number,
  // maxTitleLen: number,
  // minDescLen: number,
  // maxDescLen: number,
  // maxThumbLen: number,
};

type OuterProps = ValidationProps & {
  isStorybook?: boolean,
  history?: History,
  contentId: ContentId,
  fileName?: string,
  entity?: MusicTrackType
};

type FormValues = MusicTrackType;

type FormProps = OuterProps & FormikProps<FormValues>;

const LabelledField = JoyForms.LabelledField<FormValues>();

const LabelledText = JoyForms.LabelledText<FormValues>();

const InnerForm = (props: FormProps) => {
  const {
    isStorybook = false,
    history,
    contentId,
    entity,
    values,
    dirty,
    isValid,
    isSubmitting,
    setSubmitting,
    resetForm
  } = props;

  const { trackThumbnail } = values;

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

  const isNew = !entity;

  const buildTxParams = () => {
    if (!isValid) return [];

    return [ /* TODO save entity to versioned store */ ];
  };

  const basicInfoTab = () => <Tab.Pane as='div'>
    <LabelledText name='trackTitle' label={fieldName('trackTitle')} tooltip={tooltip('trackTitle')} {...props} />
    
    <LabelledText name='trackThumbnail' label={fieldName('trackThumbnail')} tooltip={tooltip('trackThumbnail')} {...props} />
    
    <LabelledField name='aboutTheTrack' label={fieldName('aboutTheTrack')} tooltip={tooltip('aboutTheTrack')} {...props}>
      <Field component='textarea' id='aboutTheTrack' name='aboutTheTrack' disabled={isSubmitting} rows={3} />
    </LabelledField>

    <LabelledField name='publicationStatus' label={fieldName('publicationStatus')} tooltip={tooltip('publicationStatus')} {...props}>
      <Field component={Dropdown} id='publicationStatus' name='publicationStatus' disabled={isSubmitting} selection options={visibilityOptions} />
    </LabelledField>
    
  </Tab.Pane>

  const additionalTab = () => <Tab.Pane as='div'>
    <LabelledText name='trackArtist' label={fieldName('trackArtist')} tooltip={tooltip('trackArtist')} {...props} />

    <LabelledText name='composerOrSongwriter' label={fieldName('composerOrSongwriter')} tooltip={tooltip('composerOrSongwriter')} {...props} />

    <LabelledField name='genre' label={fieldName('genre')} tooltip={tooltip('genre')} {...props}>
      <Field component={Dropdown} id='genre' name='genre' disabled={isSubmitting} search selection options={genreOptions} />
    </LabelledField>

    <LabelledField name='mood' label={fieldName('mood')} tooltip={tooltip('mood')} {...props}>
      <Field component={Dropdown} id='mood' name='mood' disabled={isSubmitting} search selection options={moodOptions} />
    </LabelledField>

    <LabelledField name='theme' label={fieldName('theme')} tooltip={tooltip('theme')} {...props}>
      <Field component={Dropdown} id='theme' name='theme' disabled={isSubmitting} search selection options={themeOptions} />
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
      {trackThumbnail && <img src={trackThumbnail} onError={onImageError} />}
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
    const { entity, fileName } = props;

    return {
      // Basic:
      trackTitle: entity && entity.trackTitle || fileName || '',
      aboutTheTrack: entity && entity.aboutTheTrack || '',
      trackThumbnail: entity && entity.trackThumbnail || DEFAULT_THUMBNAIL_URL,
      publicationStatus: entity && entity.publicationStatus || visibilityOptions[0].value,
      album: entity && entity.album || '',

      // Additional:
      trackArtist: entity && entity.trackArtist || '',
      composerOrSongwriter: entity && entity.composerOrSongwriter || '',
      genre: entity && entity.genre || genreOptions[0].value,
      mood: entity && entity.mood || moodOptions[0].value,
      theme: entity && entity.theme || themeOptions[0].value,
      explicit: entity && entity.explicit || false, // TODO explicitOptions[0].value,
      license: entity && entity.license || licenseOptions[0].value,
    };
  },

  validationSchema: () => MusicTrackValidationSchema,

  handleSubmit: () => {
    // do submitting things
  }
})(InnerForm);

export default EditForm;
