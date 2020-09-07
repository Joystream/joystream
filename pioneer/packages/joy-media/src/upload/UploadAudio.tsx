import React from 'react';
import { Button, Tab } from 'semantic-ui-react';
import { Form, withFormik } from 'formik';
import { History } from 'history';

import { TxButton } from '@polkadot/joy-utils/react/components';
import { ContentId } from '@joystream/types/media';
import { onImageError } from '../common/images';
import { MusicTrackValidationSchema, MusicTrackType, MusicTrackClass as Fields, MusicTrackFormValues, MusicTrackToFormValues } from '../schemas/music/MusicTrack';
import { withMediaForm, MediaFormProps, datePlaceholder } from '../common/MediaForms';
import EntityId from '@joystream/types/versioned-store/EntityId';
import { MediaDropdownOptions } from '../common/MediaDropdownOptions';
import { FormTabs } from '../common/FormTabs';

export type OuterProps = {
  history?: History;
  contentId: ContentId;
  fileName?: string;
  id?: EntityId;
  entity?: MusicTrackType;
  opts?: MediaDropdownOptions;
};

type FormValues = MusicTrackFormValues;

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

    return [];
  };

  const basicInfoTab = () => <Tab.Pane as='div'>
    <MediaText field={Fields.title} {...props} />
    <MediaText field={Fields.artist} {...props} />
    <MediaText field={Fields.thumbnail} {...props} />
    <MediaText field={Fields.firstReleased} placeholder={datePlaceholder} {...props} />
    <MediaText field={Fields.explicit} {...props} />
    <MediaDropdown field={Fields.license} options={opts.contentLicenseOptions} {...props} />
    <MediaDropdown field={Fields.publicationStatus} options={opts.publicationStatusOptions} {...props} />
  </Tab.Pane>;

  const additionalTab = () => <Tab.Pane as='div'>
    <MediaText field={Fields.description} textarea {...props} />
    <MediaText field={Fields.composerOrSongwriter} {...props} />
    <MediaDropdown field={Fields.genre} options={opts.musicGenreOptions} {...props} />
    <MediaDropdown field={Fields.mood} options={opts.musicMoodOptions} {...props} />
    <MediaDropdown field={Fields.theme} options={opts.musicThemeOptions} {...props} />
    <MediaDropdown field={Fields.language} options={opts.languageOptions} {...props} />
    <MediaText field={Fields.lyrics} {...props} />
    <MediaText field={Fields.attribution} {...props} />
  </Tab.Pane>;

  const tabs = <FormTabs errors={errors} panes={[
    {
      id: 'Basic info',
      render: basicInfoTab,
      fields: [
        Fields.title,
        Fields.artist,
        Fields.thumbnail,
        Fields.firstReleased,
        Fields.explicit,
        Fields.license,
        Fields.publicationStatus
      ]
    },
    {
      id: 'Additional',
      render: additionalTab,
      fields: [
        Fields.description,
        Fields.composerOrSongwriter,
        Fields.genre,
        Fields.mood,
        Fields.theme,
        Fields.language,
        Fields.lyrics,
        Fields.attribution
      ]
    }
  ]} />;

  const renderMainButton = () =>
    <TxButton
      type='submit'
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
    />;

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
