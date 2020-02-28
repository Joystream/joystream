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
import { u16, Option } from '@polkadot/types';
import { isInternalProp } from '@joystream/types/versioned-store/EntityCodec';
import { MediaObjectCodec } from '../schemas/general/MediaObject';

/** Example: "2019-01-23" -> 1548201600 */
function humanDateToUnixTs(humanFriendlyDate: string): number | undefined {
  return nonEmptyStr(humanFriendlyDate) ? moment(humanFriendlyDate).unix() : undefined
}

function isDateField(field: VideoPropId): boolean {
  return field === Fields.firstReleased.id
}

export type OuterProps = {
  history?: History,
  contentId?: ContentId,
  fileName?: string,
  channelId?: ChannelId,
  channel?: ChannelEntity,
  mediaObjectClass?: Class,
  entityClass?: Class,
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
    contentId,
    mediaObjectClass,
    entityClass,
    id,
    entity,
    opts,
    isFieldChanged,

    values,
    dirty,
    errors,
    isValid,
    isSubmitting,
    setSubmitting,
    resetForm
  } = props;

  const initialSupportedSchemaIds: number[] = entity?.inClassSchemaIndexes || []

  const [ mediaObjectId, setMediaObjectId ] = useState<EntityId | undefined>()
  const [ entityId, setEntityId ] = useState<EntityId | undefined>(id)
  const [ supportsSchema, setSupportsSchema ] = useState<boolean>(initialSupportedSchemaIds.length > 0)
  const { thumbnail } = values

  const withCredential = new Option(Credential, new Credential(2))
  const asEntityMaintainer = false
  const firstSchemaId = new u16(0)
  
  const entityCodec = new VideoCodec(entityClass!)
  const mediaObjectCodec = new MediaObjectCodec(mediaObjectClass!)

  const getFieldsValues = (): Partial<FormValues> => {
    const res: Partial<FormValues> = {}

    if (!entity && mediaObjectId) {
      res.object = mediaObjectId.toNumber()
    }

    Object.keys(values).forEach((prop) => {
      const fieldName = prop as VideoPropId
      const field = Fields[fieldName]
      let fieldValue = values[fieldName] as any

      let shouldIncludeValue = true
      if (entity) {
        // If we updating existing entity, then update only changed props:
        shouldIncludeValue = isFieldChanged(fieldName)
      } else if (field.required !== true) {
        // If we creating a new entity, then provide all required props
        // plus non empty non required props:
        if (isInternalProp(field)) {
          shouldIncludeValue = fieldValue > 0
        } else if (typeof fieldValue === 'string') {
          shouldIncludeValue = nonEmptyStr(fieldValue)
        } else if (Array.isArray(fieldValue) && fieldValue.length === 0) {
          shouldIncludeValue = false
        }
      }

      // For debugging:
      // const propForLog: any = { fieldName, fieldValue }
      // if (shouldIncludeValue) {
      //   propForLog.shouldIncludeValue = shouldIncludeValue
      // }
      // console.log(propForLog)
      
      if (shouldIncludeValue) {
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

  const buildCreateMediaObjectTxParams = () => {
    return [
      withCredential,
      mediaObjectClass!.id
    ]
  }

  const buildAddSchemaToMediaObjectTxParams = () => {
    const propValues = mediaObjectCodec.toSubstrateUpdate({
      value: contentId!.encode()
    })
    // console.log('buildAddSchemaToMediaObjectTxParams:', propValues)

    return [
      withCredential,
      asEntityMaintainer,
      mediaObjectId,
      firstSchemaId,
      propValues
    ]
  }

  const buildCreateEntityTxParams = () => {
    return [
      withCredential,
      entityClass!.id
    ]
  }

  const buildAddSchemaToEntityTxParams = () => {
    const propValues = entityCodec.toSubstrateUpdate(getFieldsValues())
    // console.log('buildAddSchemaSupportTxParams:', propValues)

    return [
      withCredential,
      asEntityMaintainer,
      entityId,
      firstSchemaId,
      propValues
    ]
  }

  const buildUpdateEntityTxParams = () => {
    const updatedPropValues = entityCodec.toSubstrateUpdate(getFieldsValues())
    // console.log('buildUpdateEntityTxParams:', updatedPropValues)

    return [
      withCredential,
      asEntityMaintainer,
      entityId,
      updatedPropValues
    ]
  };

  const onCreateMediaObjectSuccess: TxCallback = (txResult: SubmittableResult) => {
    setSubmitting(false)

    // Get id of newly created media object:
    const newId = findFirstParamOfSubstrateEvent<EntityId>(txResult, 'EntityCreated')
    setMediaObjectId(newId)

    console.log('New media object entity id:', newId && newId.toString())
  }

  const onAddSchemaToMediaObjectSuccess: TxCallback = (_txResult: SubmittableResult) => {
    setSubmitting(false)
    // Nothing yet
  }

  const onCreateEntitySuccess: TxCallback = (txResult: SubmittableResult) => {
    setSubmitting(false)

    // Get id of newly created entity:
    const newId = findFirstParamOfSubstrateEvent<EntityId>(txResult, 'EntityCreated')
    setEntityId(newId)

    console.log('New video entity id:', newId && newId.toString())
  }

  const redirectToPlaybackPage = () => {
    if (history && entityId) {
      history.push('/media/video/' + entityId.toString())
    }
  }

  const onAddSchemaToEntitySuccess: TxCallback = (_txResult: SubmittableResult) => {
    setSubmitting(false)
    setSupportsSchema(true)
    redirectToPlaybackPage()
  }

  const onUpdateEntitySuccess: TxCallback = (_txResult: SubmittableResult) => {
    setSubmitting(false)
    redirectToPlaybackPage()
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

  const CreateMediaObjectButton = () =>
    <TxButton
      type='submit'
      size='large'
      isDisabled={isSubmitting}
      label='Create media object'
      tx='versionedStorePermissions.createEntity'
      params={buildCreateMediaObjectTxParams()}
      onClick={newOnSubmit}
      txFailedCb={onTxFailed}
      txSuccessCb={onCreateMediaObjectSuccess}
    />

  const AddSchemaToMediaObjectButton = () =>
    <TxButton
      type='submit'
      size='large'
      isDisabled={isSubmitting}
      label='Add schema to media object'
      tx='versionedStorePermissions.addSchemaSupportToEntity'
      params={buildAddSchemaToMediaObjectTxParams()}
      onClick={newOnSubmit}
      txFailedCb={onTxFailed}
      txSuccessCb={onAddSchemaToMediaObjectSuccess}
    />

  const CreateEntityButton = () =>
    <TxButton
      type='submit'
      size='large'
      isDisabled={!(dirty && isValid && !isSubmitting)}
      label='Create video entity'
      tx='versionedStorePermissions.createEntity'
      params={buildCreateEntityTxParams()}
      onClick={newOnSubmit}
      txFailedCb={onTxFailed}
      txSuccessCb={onCreateEntitySuccess}
    />

  const AddSchemaToEntityButton = () =>
    <TxButton
      type='submit'
      size='large'
      isDisabled={!(dirty && isValid && !isSubmitting)}
      label='Add schema to video entity'
      tx='versionedStorePermissions.addSchemaSupportToEntity'
      params={buildAddSchemaToEntityTxParams()}
      onClick={newOnSubmit}
      txFailedCb={onTxFailed}
      txSuccessCb={onAddSchemaToEntitySuccess}
    />

  const UpdateEntityButton = () =>
    <TxButton
      type='submit'
      size='large'
      isDisabled={!(dirty && isValid && !isSubmitting)}
      label='Update video entity'
      tx='versionedStorePermissions.updateEntityPropertyValues'      
      params={buildUpdateEntityTxParams()}
      onClick={newOnSubmit}
      txFailedCb={onTxFailed}
      txSuccessCb={onUpdateEntitySuccess}
    />

  const MediaObjectButtons = () => <>
    {!mediaObjectId &&
      <CreateMediaObjectButton />
    }
    {mediaObjectId && !entityId &&
      <AddSchemaToMediaObjectButton />
    }
  </>

  const EntityButtons = () => <>
    {!entity && !entityId &&
      <CreateEntityButton />
    }
    {entityId && !supportsSchema &&
      <AddSchemaToEntityButton />
    }
    {entityId && supportsSchema &&
      <UpdateEntityButton />
    }
  </>

  return <div className='EditMetaBox'>
    <div className='EditMetaThumb'>
      {thumbnail && <img src={thumbnail} onError={onImageError} />}
    </div>

    <Form className='ui form JoyForm EditMetaForm'>      
      {tabs}
      <LabelledField style={{ marginTop: '1rem' }} {...props}>
        <MediaObjectButtons />
        {mediaObjectId && <EntityButtons />}
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
