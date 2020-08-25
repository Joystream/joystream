import React from 'react';
import { Button } from 'semantic-ui-react';
import { Form, withFormik } from 'formik';
import { History } from 'history';

import { Option } from '@polkadot/types';
import { TxButton } from '@polkadot/joy-utils/react/components';
import { onImageError } from '../common/images';
import { withMediaForm, MediaFormProps } from '../common/MediaForms';
import { ChannelType, ChannelClass as Fields, buildChannelValidationSchema, ChannelFormValues, ChannelToFormValues, ChannelGenericProp } from '../schemas/channel/Channel';
import { MediaDropdownOptions } from '../common/MediaDropdownOptions';
import { ChannelId, OptionalText } from '@joystream/types/content-working-group';
import { findFirstParamOfSubstrateEvent } from '@polkadot/joy-utils/functions/misc';
import { useMyMembership } from '@polkadot/joy-utils/react/hooks';
import { ChannelPublicationStatusDropdownOptions, isAccountAChannelOwner } from './ChannelHelpers';
import { TxCallback } from '@polkadot/react-components/Status/types';
import { SubmittableResult } from '@polkadot/api';
import { ChannelValidationConstraints } from '../transport';
import { JoyError } from '@polkadot/joy-utils/react/components';
import { Section } from '@polkadot/joy-utils/react/components';
import { useApi } from '@polkadot/react-hooks';

export type OuterProps = {
  history?: History;
  id?: ChannelId;
  entity?: ChannelType;
  constraints?: ChannelValidationConstraints;
  opts?: MediaDropdownOptions;
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
    // onTxSuccess,
    onTxFailed,

    history,
    id: existingId,
    entity,
    isFieldChanged,

    // Formik stuff:
    values,
    dirty,
    isValid,
    isSubmitting,
    setSubmitting,
    resetForm
  } = props;

  const { myAccountId, myMemberId } = useMyMembership();
  const { api } = useApi();

  if (entity && !isAccountAChannelOwner(entity, myAccountId)) {
    return <JoyError title={'Only owner can edit channel'} />;
  }

  const { avatar } = values;
  const isNew = !entity;

  // if user is not the channel owner don't render the edit form
  // return null

  const onTxSuccess: TxCallback = (txResult: SubmittableResult) => {
    setSubmitting(false);
    if (!history) return;

    const id = existingId || findFirstParamOfSubstrateEvent<ChannelId>(txResult, 'ChannelCreated');

    console.log('Channel id:', id?.toString());

    if (id) {
      history.push('/media/channels/' + id.toString());
    }
  };

  const buildTxParams = () => {
    if (!isValid) return [];

    if (!entity) {
      // Create a new channel

      const channelOwner = myMemberId;
      const roleAccount = myAccountId;
      const contentType = api.createType('ChannelContentType', values.content);

      return [
        channelOwner,
        roleAccount,
        contentType,
        values.handle,
        values.title || null,
        values.description || null,
        values.avatar || null,
        values.banner || null,
        values.publicationStatus
      ];
    } else {
      // Update an existing channel

      const updOptText = (field: ChannelGenericProp): Option<OptionalText> => {
        return api.createType('Option<OptionalText>',
          isFieldChanged(field)
            ? api.createType('Option<Text>', values[field.id])
            : null
        );
      };

      const updHandle = api.createType('Option<Text>',
        isFieldChanged(Fields.handle)
          ? values[Fields.handle.id]
          : null
      );

      const updPublicationStatus = api.createType('Option<ChannelPublicationStatus>',
        isFieldChanged(Fields.publicationStatus)
          ? api.createType('ChannelPublicationStatus', values[Fields.publicationStatus.id])
          : null
      );

      return [
        entity.id,
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

  const renderMainButton = () =>
    <TxButton
      type='submit'
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
    />;

  return <div className='EditMetaBox'>
    <div className='EditMetaThumb'>
      {avatar && <img src={avatar} onError={onImageError} />}
    </div>

    <Section title={isNew ? 'Create a channel' : 'Edit a channel'}>
      <Form className='ui form JoyForm EditMetaForm'>

        {formFields()}

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
    </Section>
  </div>;
};

export const EditForm = withFormik<OuterProps, FormValues>({

  // Transform outer props into form values
  mapPropsToValues: (props): FormValues => {
    const { entity } = props;
    return ChannelToFormValues(entity);
  },

  validationSchema: (props: OuterProps): any => {
    const { constraints } = props;
    if (!constraints) return null;

    return buildChannelValidationSchema(constraints);
  },

  handleSubmit: () => {
    // do submitting things
  }
})(withMediaForm(InnerForm) as any);

export default EditForm;
