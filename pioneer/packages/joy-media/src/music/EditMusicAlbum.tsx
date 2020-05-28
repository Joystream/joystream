import React from 'react';
import { Button, Tab } from 'semantic-ui-react';
import { Form, withFormik } from 'formik';
import { History } from 'history';

import TxButton from '@polkadot/joy-utils/TxButton';
import { onImageError } from '@polkadot/joy-utils/images';
import { ReorderableTracks } from './ReorderableTracks';
import { MusicAlbumValidationSchema, MusicAlbumType, MusicAlbumClass as Fields, MusicAlbumFormValues, MusicAlbumToFormValues } from '../schemas/music/MusicAlbum';
import { withMediaForm, MediaFormProps, datePlaceholder } from '../common/MediaForms';
import EntityId from '@joystream/types/versioned-store/EntityId';
import { MediaDropdownOptions } from '../common/MediaDropdownOptions';
import { MusicTrackReaderPreviewProps } from './MusicTrackReaderPreview';
import { FormTabs } from '../common/FormTabs';

export type OuterProps = {
  history?: History,
  id?: EntityId,
  entity?: MusicAlbumType,
  tracks?: MusicTrackReaderPreviewProps[]
  opts?: MediaDropdownOptions
};

type FormValues = MusicAlbumFormValues;

const InnerForm = (props: MediaFormProps<OuterProps, FormValues>) => {
  const {
    // React components for form fields:
    MediaText,
    MediaDropdown,
    LabelledField,

    // Callbacks:
    onSubmit,
    onTxSuccess,
    onTxFailed,

    // history,
    entity,
    tracks = [],
    opts = MediaDropdownOptions.Empty,

    values,
    dirty,
    errors,
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
    <MediaText field={Fields.artist} {...props} />
    <MediaText field={Fields.thumbnail} {...props} />
    <MediaText field={Fields.description} textarea {...props} />
    <MediaText field={Fields.firstReleased} placeholder={datePlaceholder} {...props} />
    <MediaText field={Fields.explicit} {...props} />
    <MediaDropdown field={Fields.license} options={opts.contentLicenseOptions} {...props} />
    <MediaDropdown field={Fields.publicationStatus} options={opts.publicationStatusOptions} {...props} />
  </Tab.Pane>

  const additionalTab = () => <Tab.Pane as='div'>
    <MediaText field={Fields.composerOrSongwriter} {...props} />
    <MediaDropdown field={Fields.genre} options={opts.musicGenreOptions} {...props} />
    <MediaDropdown field={Fields.mood} options={opts.musicMoodOptions} {...props} />
    <MediaDropdown field={Fields.theme} options={opts.musicThemeOptions} {...props} />
    <MediaDropdown field={Fields.language} options={opts.languageOptions} {...props} />
    <MediaText field={Fields.lyrics} {...props} />
    <MediaText field={Fields.attribution} {...props} />
  </Tab.Pane>

  const tracksTab = () => <Tab.Pane as='div'>
    <ReorderableTracks
      tracks={tracks}
      noTracksView={<em style={{ padding: '1rem 0', display: 'block' }}>This album has no tracks yet.</em>}
    />
  </Tab.Pane>

  const tabs = <FormTabs errors={errors} panes={[
    {
      id: 'Basic info',
      render: basicInfoTab,
      fields: [
        Fields.title,
        Fields.artist,
        Fields.thumbnail,
        Fields.description,
        Fields.firstReleased,
        Fields.explicit,
        Fields.license,
        Fields.publicationStatus,
      ]
    },
    {
      id: 'Additional',
      render: additionalTab,
      fields: [
        Fields.composerOrSongwriter,
        Fields.genre,
        Fields.mood,
        Fields.theme,
        Fields.language,
        Fields.lyrics,
        Fields.attribution,
      ]
    },
    {
      id: `Tracks (${tracks.length})`,
      render: tracksTab
    }
  ]} />;

  const renderMainButton = () =>
    <TxButton
      type='submit'
      size='large'
      isDisabled={!dirty || isSubmitting}
      label={isNew
        ? 'Publish'
        : 'Update'
      }
      params={buildTxParams()}
      tx={isNew
        ? 'dataDirectory.addMetadata'
        : 'dataDirectory.updateMetadata'
      }
      onClick={onSubmit}
      txFailedCb={onTxFailed}
      txSuccessCb={onTxSuccess}
    />

  return <div className='EditMetaBox'>
    <div className='EditMetaThumb'>
      {thumbnail && <img src={thumbnail} onError={onImageError} />}
    </div>

    <Form className='ui form JoyForm EditMetaForm'>

      {tabs}

      <LabelledField style={{ marginTop: '1rem' }} {...props}>
        {renderMainButton()}
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
  mapPropsToValues: (props): FormValues => {
    const { entity } = props;
    return MusicAlbumToFormValues(entity);
  },

  validationSchema: MusicAlbumValidationSchema,

  handleSubmit: () => {
    // do submitting things
  }
})(withMediaForm(InnerForm) as any);

export default EditForm;
