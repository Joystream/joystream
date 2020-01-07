import React from 'react';
import { Button } from 'semantic-ui-react';
import { Form, withFormik } from 'formik';
import { History } from 'history';

import TxButton from '@polkadot/joy-utils/TxButton';
import { onImageError, DEFAULT_THUMBNAIL_URL } from '../utils';
import * as Opts from '../common/DropdownOptions';
import { withMediaForm, MediaFormProps } from '../common/MediaForms';
import { ChannelType, ChannelClass as Fields, ChannelValidationSchema, ChannelFormValues } from '../schemas/channel/Channel';
import { ChannelId } from './ChannelId';

export type OuterProps = {
  history?: History,
  id?: ChannelId,
  entity?: ChannelType
};

type FormValues = ChannelFormValues;

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

    return [ /* TODO save channel updates */ ];
  };

  const formFields = () => <>
    
    {/* TODO add channel content type dropdown */}
    
    <MediaText field={Fields.channelName} {...props} />
    <MediaText field={Fields.thumbnail} {...props} />
    <MediaText field={Fields.cover} {...props} />
    <MediaText field={Fields.description} textarea {...props} />
    <MediaDropdown field={Fields.publicationStatus} options={Opts.visibilityOptions} {...props} />
  </>;

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
      
      {formFields()}

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
    const { entity } = props;

    return {
      // Basic:
      channelName: entity && entity.channelName || '',
      thumbnail: entity && entity.thumbnail || DEFAULT_THUMBNAIL_URL,
      cover: entity && entity.cover || DEFAULT_THUMBNAIL_URL,
      description: entity && entity.description || '',
      publicationStatus: entity && entity.publicationStatus.value || Opts.visibilityOptions[0].value,
    } as FormValues; // TODO remove this hack with casting
  },

  validationSchema: () => ChannelValidationSchema,

  handleSubmit: () => {
    // do submitting things
  }
})(withMediaForm(InnerForm) as any);

export default EditForm;
