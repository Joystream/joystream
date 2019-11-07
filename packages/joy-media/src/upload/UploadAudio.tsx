import React from 'react';
import { Button, Tab, Dropdown } from 'semantic-ui-react';
import { Form, Field, withFormik, FormikProps } from 'formik';
import * as Yup from 'yup';
import BN from 'bn.js';
import { History } from 'history';

import TxButton from '@polkadot/joy-utils/TxButton';
import { SubmittableResult } from '@polkadot/api';

import * as JoyForms from '@polkadot/joy-utils/forms';
import { Text } from '@polkadot/types';
import { Option } from '@polkadot/types/codec';
import { ContentId, ContentMetadataUpdate, SchemaId, ContentVisibility, VecContentId } from '@joystream/types/media';
import { onImageError } from '../utils';
import { MusicTrackEntity } from '../entities/MusicTrackEntity';

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

const buildSchema = () => Yup.object().shape({
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
    .required('Thumbnail is required')
});

type ValidationProps = {
  // minNameLen: number,
  // maxNameLen: number,
  // minDescLen: number,
  // maxDescLen: number,
  // maxThumbLen: number,
};

type OuterProps = ValidationProps & {
  isStorybook?: boolean,
  history?: History,
  contentId: ContentId,
  fileName?: string,
  entity?: MusicTrackEntity
};

type FormValues = MusicTrackEntity;

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

  const {
    name,
    description,
    thumbnail
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

  const isNew = !entity;

  const buildTxParams = () => {
    if (!isValid) return [];

    const json = JSON.stringify({
      name,
      description,
      thumbnail
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
    <LabelledText name='name' label={`Title`} {...props} />
    
    <LabelledText name='thumbnail' label={`Thumbnail image URL`} {...props} />
    
    <LabelledField name='description' label={`About this track`} {...props}>
      <Field component='textarea' id='description' name='description' disabled={isSubmitting} rows={3} />
    </LabelledField>

    <LabelledField name='visibility' label={`Visibility`} {...props}>
      <Field component={Dropdown} id='visibility' name='visibility' disabled={isSubmitting} selection options={visibilityOptions} />
    </LabelledField>
    
  </Tab.Pane>

  const additionalTab = () => <Tab.Pane as='div'>
    <LabelledText name='artist' label={`Artist`} {...props} />
    <LabelledText name='composer' label={`Composer`} {...props} />

    <LabelledField name='genre' label={`Genre`} {...props}>
      <Field component={Dropdown} id='genre' name='genre' disabled={isSubmitting} search selection options={genreOptions} />
    </LabelledField>

    <LabelledField name='mood' label={`Mood`} {...props}>
      <Field component={Dropdown} id='mood' name='mood' disabled={isSubmitting} search selection options={moodOptions} />
    </LabelledField>

    <LabelledField name='theme' label={`Theme`} {...props}>
      <Field component={Dropdown} id='theme' name='theme' disabled={isSubmitting} search selection options={themeOptions} />
    </LabelledField>

    <LabelledField name='license' label={`License`} {...props}>
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
    {thumbnail &&
      <img src={thumbnail} onError={onImageError} />
    }
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
      name: entity && entity.name || fileName || '',
      description: entity && entity.description || '',
      thumbnail: entity && entity.thumbnail || '',
      visibility: entity && entity.visibility || visibilityOptions[0].value,
      album: entity && entity.album || '',

      // Additional:
      artist: entity && entity.artist || '',
      composer: entity && entity.composer || '',
      genre: entity && entity.genre || genreOptions[0].value,
      mood: entity && entity.mood || moodOptions[0].value,
      theme: entity && entity.theme || themeOptions[0].value,
      explicit: entity && entity.explicit || false, // TODO explicitOptions[0].value,
      license: entity && entity.license || licenseOptions[0].value,
    };
  },

  validationSchema: buildSchema,

  handleSubmit: () => {
    // do submitting things
  }
})(InnerForm);

export default EditForm;
