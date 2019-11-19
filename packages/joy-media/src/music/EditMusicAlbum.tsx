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
import { onImageError, DEFAULT_THUMBNAIL_URL } from '../utils';
import { MusicAlbumEntity } from '../entities/MusicAlbumEntity';
import { MusicTrackEntity } from '../entities/MusicTrackEntity';
import { ReorderableTracks } from './ReorderableTracks';
import { MusicAlbumPreviewProps } from './MyMusicAlbums';

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
  title: Yup.string()
    // .min(p.minTitleLen, `Title is too short. Minimum length is ${p.minTitleLen} chars.`)
    // .max(p.maxTitleLen, `Title is too long. Maximum length is ${p.maxTitleLen} chars.`)
    .required('Title is required')
    ,
  about: Yup.string()
    // .min(p.minDescLen, `Description is too short. Minimum length is ${p.minDescLen} chars.`)
    // .max(p.maxDescLen, `Description is too long. Maximum length is ${p.maxDescLen} chars.`)
    .required('Text about this album is required')
    ,
  cover: Yup.string()
    // .max(p.maxThumbLen, `Cover URL is too long. Maximum length is ${p.maxThumbLen} chars.`)
    .url('Cover must be a valid URL of an image.')
    .required('Cover is required')
});

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
  entity?: MusicAlbumEntity,
  tracks?: MusicTrackEntity[]
};

type FormValues = MusicAlbumEntity;

type FormProps = OuterProps & FormikProps<FormValues>;

const LabelledField = JoyForms.LabelledField<FormValues>();

const LabelledText = JoyForms.LabelledText<FormValues>();

const InnerForm = (props: FormProps) => {
  const {
    isStorybook = false,
    history,
    contentId,
    entity,
    tracks = [],
    values,
    dirty,
    isValid,
    isSubmitting,
    setSubmitting,
    resetForm
  } = props;

  const {
    title,
    about,
    cover,
    artist
  } = values;

  const onSubmit = (sendTx: () => void) => {
    if (isValid) sendTx();
  };

  const onTxCancelled = () => {
    // Nothing yet
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
      title,
      about,
      cover
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
    <LabelledText name='title' label={`Title`} tooltip={tooltip('title')} {...props} />
    
    <LabelledText name='cover' label={`Cover image URL`} tooltip={tooltip('cover')} {...props} />
    
    <LabelledField name='about' label={`About this album`} tooltip={tooltip('about')} {...props}>
      <Field component='textarea' id='about' name='about' disabled={isSubmitting} rows={3} />
    </LabelledField>

    <LabelledField name='visibility' label={`Visibility`} tooltip={tooltip('visibility')} {...props}>
      <Field component={Dropdown} id='visibility' name='visibility' disabled={isSubmitting} selection options={visibilityOptions} />
    </LabelledField>
    
  </Tab.Pane>

  const additionalTab = () => <Tab.Pane as='div'>
    <LabelledText name='artist' label={`Artist`} tooltip={tooltip('artist')} {...props} />

    <LabelledText name='composer' label={`Composer`} tooltip={tooltip('composer')} {...props} />

    <LabelledField name='genre' label={`Genre`} tooltip={tooltip('genre')} {...props}>
      <Field component={Dropdown} id='genre' name='genre' disabled={isSubmitting} search selection options={genreOptions} />
    </LabelledField>

    <LabelledField name='mood' label={`Mood`} tooltip={tooltip('mood')} {...props}>
      <Field component={Dropdown} id='mood' name='mood' disabled={isSubmitting} search selection options={moodOptions} />
    </LabelledField>

    <LabelledField name='theme' label={`Theme`} tooltip={tooltip('theme')} {...props}>
      <Field component={Dropdown} id='theme' name='theme' disabled={isSubmitting} search selection options={themeOptions} />
    </LabelledField>

    <LabelledField name='license' label={`License`} tooltip={tooltip('license')} {...props}>
      <Field component={Dropdown} id='license' name='license' disabled={isSubmitting} search selection options={licenseOptions} />
    </LabelledField>
  </Tab.Pane>

  const tracksTab = () => {
    const album: MusicAlbumPreviewProps = {
      title,
      artist,
      cover,
      tracksCount: tracks.length
    }

    return <Tab.Pane as='div'>
      <ReorderableTracks 
        album={album} tracks={tracks}
      />
    </Tab.Pane>
  }

  const tabs = () => <Tab
    menu={{ secondary: true, pointing: true, color: 'blue' }}
    panes={[
      { menuItem: 'Basic info', render: basicInfoTab },
      { menuItem: 'Additional', render: additionalTab },
      { menuItem: `Tracks (${tracks.length})`, render: tracksTab },
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
      {cover && <img src={cover} onError={onImageError} />}
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

export const EditMusicAlbum = withFormik<OuterProps, FormValues>({

  // Transform outer props into form values
  mapPropsToValues: props => {
    const { entity, fileName } = props;

    return {
      // Basic:
      title: entity && entity.title || fileName || '',
      about: entity && entity.about || '',
      cover: entity && entity.cover || DEFAULT_THUMBNAIL_URL,
      // visibility: entity && entity.visibility || visibilityOptions[0].value,

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

export default EditMusicAlbum;
