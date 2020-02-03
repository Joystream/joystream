import React from 'react';
import { Button } from 'semantic-ui-react';
import { Form, withFormik } from 'formik';
import { History } from 'history';

import TxButton from '@polkadot/joy-utils/TxButton';
import { onImageError } from '../utils';
import { withMediaForm, MediaFormProps } from '../common/MediaForms';
import { ChannelType, ChannelClass as Fields, ChannelValidationSchema, ChannelFormValues, ChannelToFormValues } from '../schemas/channel/Channel';
import { MediaDropdownOptions } from '../common/MediaDropdownOptions';
import { ChannelId } from '@joystream/types/content-working-group';

export type OuterProps = {
  history?: History,
  id?: ChannelId,
  entity?: ChannelType
  opts?: MediaDropdownOptions
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
    opts = MediaDropdownOptions.Empty,

    // Formik stuff:
    values,
    dirty,
    isValid,
    isSubmitting,
    resetForm
  } = props;

  const { avatar } = values;

  const isNew = !entity;

  const buildTxParams = () => {
    if (!isValid) return [];

    return [ /* TODO save channel updates */ ];
  };

  const formFields = () => <>
    
    {/* TODO add channel content type dropdown */}
    
    <MediaText field={Fields.handle} {...props} />
    <MediaText field={Fields.title} {...props} />
    <MediaText field={Fields.avatar} {...props} />
    <MediaText field={Fields.banner} {...props} />
    <MediaText field={Fields.description} textarea {...props} />
    <MediaDropdown field={Fields.publicationStatus} options={opts.publicationStatusOptions} {...props} />
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
      {avatar && <img src={avatar} onError={onImageError} />}
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
    return ChannelToFormValues(entity);
  },

  validationSchema: () => ChannelValidationSchema,

  handleSubmit: () => {
    // do submitting things
  }
})(withMediaForm(InnerForm) as any);

export default EditForm;
