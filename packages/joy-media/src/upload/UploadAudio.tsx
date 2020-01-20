import React from 'react';
import { Button, Tab } from 'semantic-ui-react';
import { Form, withFormik } from 'formik';
import { History } from 'history';

import TxButton from '@polkadot/joy-utils/TxButton';
import { ContentId } from '@joystream/types/media';
import { onImageError } from '../utils';
import { MusicTrackValidationSchema, MusicTrackType, MusicTrackClass as Fields, MusicTrackFormValues, MusicTrackToFormValues } from '../schemas/music/MusicTrack';
import { withMediaForm, MediaFormProps } from '../common/MediaForms';
import EntityId from '@joystream/types/versioned-store/EntityId';
import { MediaDropdownOptions } from '../common/MediaDropdownOptions';
import { newTabsMeta, newTabMenuItemRenderer } from '../common/FormTabs';

export type OuterProps = {
  history?: History,
  contentId: ContentId,
  fileName?: string,
  id?: EntityId,
  entity?: MusicTrackType
  opts?: MediaDropdownOptions
};

type FormValues = MusicTrackFormValues;

const tabTitles = {
  basic: 'Basic info',
  additional: 'Additional',
};

const tabsMeta = newTabsMeta({
  [tabTitles.basic]: [
    Fields.title,
    Fields.thumbnail,
    Fields.description,
    Fields.publicationStatus,
  ],
  [tabTitles.additional]: [
    Fields.artist,
    Fields.composerOrSongwriter,
    Fields.genre,
    Fields.mood,
    Fields.theme,
    Fields.license,
  ],
});

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
    // contentId,
    entity,
    opts = MediaDropdownOptions.Empty,

    // Formik stuff:
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
    <MediaText field={Fields.thumbnail} {...props} />
    <MediaText field={Fields.description} textarea {...props} />
    <MediaDropdown field={Fields.publicationStatus} options={opts.publicationStatusOptions} {...props} />
  </Tab.Pane>

  const additionalTab = () => <Tab.Pane as='div'>
    <MediaText field={Fields.artist} {...props} />
    <MediaText field={Fields.composerOrSongwriter} {...props} />
    <MediaDropdown field={Fields.genre} options={opts.musicGenreOptions} {...props} />
    <MediaDropdown field={Fields.mood} options={opts.musicMoodOptions} {...props} />
    <MediaDropdown field={Fields.theme} options={opts.musicThemeOptions} {...props} />
    <MediaDropdown field={Fields.license} options={opts.contentLicenseOptions} {...props} />
  </Tab.Pane>

const tabs = () => {
  const renderMenuItem = newTabMenuItemRenderer(tabsMeta, errors);
  return <Tab
    menu={{ secondary: true, pointing: true, color: 'blue' }}
    panes={[
      { menuItem: renderMenuItem(tabTitles.basic), render: basicInfoTab },
      { menuItem: renderMenuItem(tabTitles.additional), render: additionalTab },
    ]}
  />;
}

  const MainButton = () =>
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
  mapPropsToValues: (props): FormValues => {
    const { entity, fileName } = props;
    const res = MusicTrackToFormValues(entity);
    if (!res.title && fileName) {
      res.title = fileName;
    }
    return res;
  },

  validationSchema: () => MusicTrackValidationSchema,

  handleSubmit: () => {
    // do submitting things
  }
})(withMediaForm(InnerForm) as any);

export default EditForm;
