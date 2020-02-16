import React from 'react';
import { Button } from 'semantic-ui-react';
import { Form, withFormik } from 'formik';
import { History } from 'history';

import { Text, Option } from '@polkadot/types';
import TxButton from '@polkadot/joy-utils/TxButton';
import { onImageError } from '../utils';
import { withMediaForm, MediaFormProps } from '../common/MediaForms';
import { ChannelType, ChannelClass as Fields, ChannelValidationSchema, ChannelFormValues, ChannelToFormValues, ChannelGenericProp } from '../schemas/channel/Channel';
import { MediaDropdownOptions } from '../common/MediaDropdownOptions';
import { ChannelId, ChannelContentType, ChannelPublicationStatus, OptionalText } from '@joystream/types/content-working-group';
import { newOptionalText } from '@polkadot/joy-utils/';
import { useMyMembership } from '@polkadot/joy-utils/MyMembershipContext';
import { ChannelPublicationStatusDropdownOptions } from './ChannelHelpers';

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
    entity,
    isFieldChanged,

    // Formik stuff:
    values,
    dirty,
    isValid,
    isSubmitting,
    resetForm
  } = props;

  const { myAddress, myMemberId } = useMyMembership();
  const { avatar } = values;
  const isNew = !entity;

  // TODO redirect to channel's page on successful creation or update

  const buildTxParams = () => {
    if (!isValid) return [];

    // TODO get value from the form:
    const publicationStatus = new ChannelPublicationStatus('Public');

    if (!entity) {

      // Create a new channel

      const channelOwner = myMemberId;
      const roleAccount = myAddress;
      const contentType = new ChannelContentType(values.content);

      return [
        channelOwner,
        roleAccount,
        contentType,
        new Text(values.handle),
        newOptionalText(values.title),
        newOptionalText(values.description),
        newOptionalText(values.avatar),
        newOptionalText(values.banner),
        publicationStatus
      ];
    } else {

      // Update an existing channel

      const updOptText = (field: ChannelGenericProp): Option<OptionalText> => {
        return new Option(OptionalText,
          isFieldChanged(field)
            ? newOptionalText(values[field.id])
            : null
        )
      }

      const updHandle = new Option(Text,
        isFieldChanged(Fields.handle)
          ? values[Fields.handle.id]
          : null
      )

      const updPublicationStatus = new Option(ChannelPublicationStatus,
        isFieldChanged(Fields.publicationStatus)
          ? new ChannelPublicationStatus(values[Fields.publicationStatus.id] as any)
          : null
      )

      return [
        new ChannelId(entity.id),
        updHandle,
        updOptText(Fields.title),
        updOptText(Fields.description),
        updOptText(Fields.avatar),
        updOptText(Fields.banner),
        updPublicationStatus
      ];
    }
  };

  const formFields = () => <>    
    <MediaText field={Fields.handle} {...props} />
    <MediaText field={Fields.title} {...props} />
    <MediaText field={Fields.avatar} {...props} />
    <MediaText field={Fields.banner} {...props} />
    <MediaText field={Fields.description} textarea {...props} />

    <MediaDropdown
      {...props}
      field={Fields.publicationStatus}
      options={ChannelPublicationStatusDropdownOptions}
    />
  </>;

  const MainButton = () =>
    <TxButton
      type='submit'
      size='large'
      isDisabled={!dirty || isSubmitting}
      label={isNew
        ? 'Create channel'
        : 'Update channel'
      }
      params={buildTxParams()}
      tx={isNew
        ? 'contentWorkingGroup.createChannel'
        : 'contentWorkingGroup.updateChannelAsOwner'
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
