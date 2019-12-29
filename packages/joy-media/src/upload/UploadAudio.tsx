import React from 'react';
import { Button, Tab } from 'semantic-ui-react';
import { Form, withFormik } from 'formik';
import { History } from 'history';

import TxButton from '@polkadot/joy-utils/TxButton';
import { ContentId } from '@joystream/types/media';
import { onImageError, DEFAULT_THUMBNAIL_URL } from '../utils';
import { MusicTrackValidationSchema, MusicTrackType, MusicTrackClass as Fields } from '../schemas/music/MusicTrack';
import * as Opts from '../common/DropdownOptions';
import { withMediaForm, MediaFormProps } from '../common/MediaForms';
import EntityId from '@joystream/types/versioned-store/EntityId';

export type OuterProps = {
  history?: History,
  contentId: ContentId,
  fileName?: string,
  id?: EntityId,
  entity?: MusicTrackType
};

type FormValues = MusicTrackType;

const InnerForm = (props: MediaFormProps<OuterProps, FormValues>) => {
  const {
    // React components for form fields:
    MediaText,
    MediaField,
    MediaDropdown,
    LabelledField,

    // Callbacks:
    onSubmit,
    onTxSuccess,
    onTxFailed,

    // history,
    // contentId,
    entity,

    // Formik stuff:
    values,
    dirty,
    isValid,
    isSubmitting,
    resetForm
  } = props;

  const { thumbnail } = values;

  const isNew = !entity;

  const buildTxParams = () => {
    if (!isValid) return [];

    return [ /* TODO save entity to versioned store */ ];
  };

  const basicInfoTab = () => <Tab.Pane as='div'>
    <MediaText field={Fields.title} {...props} />
    <MediaText field={Fields.thumbnail} {...props} />
    <MediaField field={Fields.description} component='textarea' rows={3} disabled={isSubmitting} {...props} />
    <MediaDropdown field={Fields.publicationStatus} options={Opts.visibilityOptions} {...props} />
  </Tab.Pane>

  const additionalTab = () => <Tab.Pane as='div'>
    <MediaText field={Fields.artist} {...props} />
    <MediaText field={Fields.composerOrSongwriter} {...props} />
    <MediaDropdown field={Fields.genre} options={Opts.genreOptions} {...props} />
    <MediaDropdown field={Fields.mood} options={Opts.moodOptions} {...props} />
    <MediaDropdown field={Fields.theme} options={Opts.themeOptions} {...props} />
    <MediaDropdown field={Fields.license} options={Opts.licenseOptions} {...props} />
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
    const { entity, fileName } = props;

    return {
      // Basic:
      title: entity && entity.title || fileName || '',
      thumbnail: entity && entity.thumbnail || DEFAULT_THUMBNAIL_URL,
      description: entity && entity.description || '',
      publicationStatus: entity && entity.publicationStatus || Opts.visibilityOptions[0].value,
      // album: entity && entity.album || '',

      // Additional:
      artist: entity && entity.artist || '',
      composerOrSongwriter: entity && entity.composerOrSongwriter || '',
      genre: entity && entity.genre || Opts.genreOptions[0].value,
      mood: entity && entity.mood || Opts.moodOptions[0].value,
      theme: entity && entity.theme || Opts.themeOptions[0].value,
      // explicit: entity && entity.explicit || false, // TODO explicitOptions[0].value,
      license: entity && entity.license || Opts.licenseOptions[0].value,
    };
  },

  validationSchema: () => MusicTrackValidationSchema,

  handleSubmit: () => {
    // do submitting things
  }
})(withMediaForm(InnerForm));

export default EditForm;
