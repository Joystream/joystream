import React, { useState } from 'react';
import { Button, Tab } from 'semantic-ui-react';
import { Form, withFormik } from 'formik';
import { History } from 'history';
import moment from 'moment';

import TxButton, { OnTxButtonClick } from '@polkadot/joy-utils/TxButton';
import { ContentId } from '@joystream/types/media';
import { onImageError } from '../utils';
import { VideoValidationSchema, VideoType, VideoClass as Fields, VideoFormValues, VideoToFormValues, VideoCodec, VideoPropId } from '../schemas/video/Video';
import { MediaFormProps, withMediaForm, datePlaceholder } from '../common/MediaForms';
import EntityId from '@joystream/types/versioned-store/EntityId';
import { MediaDropdownOptions } from '../common/MediaDropdownOptions';
import { FormTabs } from '../common/FormTabs';
import { ChannelId } from '@joystream/types/content-working-group';
import { ChannelEntity } from '../entities/ChannelEntity';
import { Credential } from '@joystream/types/versioned-store/permissions/credentials';
import { Class } from '@joystream/types/versioned-store';
import { TxCallback } from '@polkadot/react-components/Status/types';
import { SubmittableResult } from '@polkadot/api';
import { findFirstParamOfSubstrateEvent, nonEmptyStr } from '@polkadot/joy-utils/';

/** Example: "2019-01-23" -> 1548201600 */
function humanDateToUnixTs(humanFriendlyDate: string): number | undefined {
  return nonEmptyStr(humanFriendlyDate) ? moment(humanFriendlyDate).unix() : undefined
}

function isDateField(field: VideoPropId): boolean {
  return field === Fields.firstReleased.id
}

export type OuterProps = {
  history?: History,
  contentId: ContentId,
  fileName?: string,
  channelId?: ChannelId,
  channel?: ChannelEntity,
  entityClass: Class,
  id?: EntityId,
  entity?: VideoType
  opts?: MediaDropdownOptions
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
    // onTxSuccess,
    onTxFailed,

    history,
    // contentId,
    entityClass,
    id,
    entity,
    opts,
    isFieldChanged,

    values,
    dirty,
    errors,
    // isValid,
    isSubmitting,
    setSubmitting,
    resetForm
  } = props;

  const [ entityId, setEntityId ] = useState<EntityId | undefined>(id)
  const { thumbnail } = values;
  const withCredential = new Credential(2)
  // const isNew = !entity;

  const getValuesOfUpdatedFields = (): Partial<FormValues> => {
    const res: Partial<FormValues> = {}
    Object.keys(values).forEach((prop) => {
      const fieldName = prop as VideoPropId
      if (isFieldChanged(fieldName)) {
        let fieldValue = values[fieldName] as any
        if (typeof fieldValue === 'string') {
          fieldValue = fieldValue.trim()
        }
        if (isDateField(fieldName)) {
          fieldValue = humanDateToUnixTs(fieldValue)
        }
        res[fieldName] = fieldValue
      }
    })
    return res
  }

  // TODO Batch create + update entity operations with versionedStorePermissions.transaction function

  const buildCreateTxParams = () => {
    return [
      withCredential,
      entityClass.id
    ]
  }

  const buildUpdateTxParams = () => {
    const asEntityMaintainer = false

    const codec = new VideoCodec(entityClass)
    const updatedProps = codec.toSubstrateUpdate(getValuesOfUpdatedFields())
    // console.log('buildUpdateTxParams updatedProps:', updatedProps)

    return [
      withCredential,
      asEntityMaintainer,
      entityId,
      updatedProps
    ]
  };

  const onCreateEntitySuccess: TxCallback = (txResult: SubmittableResult) => {
    setSubmitting(false)

    // Get id of newly created entity:
    const newId = findFirstParamOfSubstrateEvent<EntityId>(txResult, 'EntityCreated')
    setEntityId(newId)

    console.log('New video entity id:', newId && newId.toString())
  }

  const onUpdateEntitySuccess: TxCallback = (_txResult: SubmittableResult) => {
    setSubmitting(false)
    if (!history) return

    // Redirect to playback video page:
    if (entity) {
      history.push('/media/video/' + entity.id.toString())
    }
  }

  const basicInfoTab = () => <Tab.Pane as='div'>
    <MediaText field={Fields.title} {...props} />
    <MediaText field={Fields.thumbnail} {...props} />
    <MediaText field={Fields.description} textarea {...props} />
    <MediaDropdown field={Fields.language} options={opts.languageOptions} {...props} />
    <MediaText field={Fields.firstReleased} placeholder={datePlaceholder} {...props} />
    <MediaText field={Fields.explicit} {...props} />
    <MediaDropdown field={Fields.license} options={opts.contentLicenseOptions} {...props} />
    <MediaDropdown field={Fields.publicationStatus} options={opts.publicationStatusOptions} {...props} />
  </Tab.Pane>

  const additionalTab = () => <Tab.Pane as='div'>
    <MediaDropdown field={Fields.category} options={opts.videoCategoryOptions} {...props} />
    <MediaText field={Fields.link} {...props} />
    <MediaText field={Fields.attribution} {...props} />
  </Tab.Pane>

  const tabs = <FormTabs errors={errors} panes={[
    {
      id: 'Basic info',
      render: basicInfoTab,
      fields: [
        Fields.title,
        Fields.thumbnail,
        Fields.description,
        Fields.language,
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
        Fields.category,
        Fields.link,
        Fields.attribution,
      ]
    }
  ]} />;

  const newOnSubmit: OnTxButtonClick = (sendTx: () => void) => {
    
    // TODO Switch to the first tab with errors if any
    
    if (onSubmit) {
      onSubmit(sendTx);
    }
  }

  const CreateEntityButton = () =>
    <TxButton
      type='submit'
      size='large'
      isDisabled={!dirty || isSubmitting}
      label='Create video entity'
      tx='versionedStorePermissions.createEntity'
      params={buildCreateTxParams()}
      onClick={newOnSubmit}
      txFailedCb={onTxFailed}
      txSuccessCb={onCreateEntitySuccess}
    />

  const UpdateEntityButton = () =>
    <TxButton
      type='submit'
      size='large'
      isDisabled={!dirty || isSubmitting}
      label='Update video entity'
      tx='versionedStorePermissions.updateEntityPropertyValues'      
      params={buildUpdateTxParams()}
      onClick={newOnSubmit}
      txFailedCb={onTxFailed}
      txSuccessCb={onUpdateEntitySuccess}
    />

  return <div className='EditMetaBox'>
    <div className='EditMetaThumb'>
      {thumbnail && <img src={thumbnail} onError={onImageError} />}
    </div>

    <Form className='ui form JoyForm EditMetaForm'>
      
      {tabs}

      <LabelledField style={{ marginTop: '1rem' }} {...props}>
        <CreateEntityButton />
        <UpdateEntityButton />
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
    const res = VideoToFormValues(entity);
    if (!res.title && fileName) {
      res.title = fileName;
    }
    return res;
  },

  validationSchema: () => VideoValidationSchema,

  handleSubmit: () => {
    // do submitting things
  }
})(withMediaForm(InnerForm) as any);

export default EditForm;
