import React from 'react';
import { Button, Tab } from 'semantic-ui-react';
import { Form, withFormik } from 'formik';
import { History } from 'history';

import TxButton from '@polkadot/joy-utils/TxButton';
import { ContentId } from '@joystream/types/media';
import { onImageError, DEFAULT_THUMBNAIL_URL } from '../utils';
import { VideoValidationSchema, VideoType, VideoClass as Fields, VideoFormValues } from '../schemas/video/Video';
import { MediaFormProps, withMediaForm } from '../common/MediaForms';
import { visibilityOptions, licenseOptions } from '../common/DropdownOptions';
import * as Opts from '../common/DropdownOptions';
import EntityId from '@joystream/types/versioned-store/EntityId';

export type OuterProps = {
  history?: History,
  contentId: ContentId,
  fileName?: string,
  id?: EntityId,
  entity?: VideoType
};

type FormValues = VideoFormValues;

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
    <MediaText field={Fields.description} textarea {...props} />
    <MediaDropdown field={Fields.publicationStatus} options={Opts.visibilityOptions} {...props} />
  </Tab.Pane>

  const additionalTab = () => <Tab.Pane as='div'>
    <MediaDropdown field={Fields.category} options={Opts.videoCategoryOptions} {...props} />
    <MediaDropdown field={Fields.language} options={Opts.languageOptions} {...props} />
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
      publicationStatus: visibilityOptions[0].value,

      // Additional:
      category: Opts.videoCategoryOptions[0].value,
      language: Opts.languageOptions[0].value,
      // explicit: '',// TODO explicitOptions[0].value,
      license: licenseOptions[0].value,
    };
  },

  validationSchema: () => VideoValidationSchema,

  handleSubmit: () => {
    // do submitting things
  }
})(withMediaForm(InnerForm));

export default EditForm;
