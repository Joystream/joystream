import React from 'react';
import { Button, Tab } from 'semantic-ui-react';
import { Form, withFormik } from 'formik';
import { History } from 'history';
import moment from 'moment';

import TxButton, { OnTxButtonClick } from '@polkadot/joy-utils/TxButton';
import { ContentId } from '@joystream/types/media';
import { onImageError } from '@polkadot/joy-utils/images';
import { VideoValidationSchema, VideoType, VideoClass as Fields, VideoFormValues, VideoToFormValues, VideoCodec, VideoPropId } from '../schemas/video/Video';
import { MediaFormProps, withMediaForm, datePlaceholder } from '../common/MediaForms';
import EntityId from '@joystream/types/versioned-store/EntityId';
import { MediaDropdownOptions } from '../common/MediaDropdownOptions';
import { FormTabs } from '../common/FormTabs';
import { ChannelId } from '@joystream/types/content-working-group';
import { ChannelEntity } from '../entities/ChannelEntity';
import { Credential } from '@joystream/types/common';
import { Class, VecClassPropertyValue } from '@joystream/types/versioned-store';
import { TxCallback } from '@polkadot/react-components/Status/types';
import { SubmittableResult } from '@polkadot/api';
import { nonEmptyStr, filterSubstrateEventsAndExtractData } from '@polkadot/joy-utils/index';
import { u16, u32, bool, Option, Vec } from '@polkadot/types';
import { isInternalProp } from '@joystream/types/versioned-store/EntityCodec';
import { MediaObjectCodec } from '../schemas/general/MediaObject';
import { Operation } from '@joystream/types/versioned-store/permissions/batching';
import { OperationType } from '@joystream/types/versioned-store/permissions/batching/operation-types';
import { ParametrizedEntity } from '@joystream/types/versioned-store/permissions/batching/parametrized-entity';
import ParametrizedClassPropertyValue from '@joystream/types/versioned-store/permissions/batching/ParametrizedClassPropertyValue';
import { ParametrizedPropertyValue } from '@joystream/types/versioned-store/permissions/batching/parametrized-property-value';
import { ParameterizedClassPropertyValues } from '@joystream/types/versioned-store/permissions/batching/operations';
import { useMyMembership } from '@polkadot/joy-utils/MyMembershipContext';
import { isAccountAChannelOwner } from '../channels/ChannelHelpers';
import { JoyError } from '@polkadot/joy-utils/JoyStatus';

/** Example: "2019-01-23" -> 1548201600 */
function humanDateToUnixTs (humanFriendlyDate: string): number | undefined {
  return nonEmptyStr(humanFriendlyDate) ? moment(humanFriendlyDate).unix() : undefined;
}

function isDateField (field: VideoPropId): boolean {
  return field === Fields.firstReleased.id;
}

export type OuterProps = {
  history?: History;
  contentId?: ContentId;
  fileName?: string;
  channelId?: ChannelId;
  channel?: ChannelEntity;
  mediaObjectClass?: Class;
  entityClass?: Class;
  id?: EntityId;
  entity?: VideoType;
  opts?: MediaDropdownOptions;
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

  const { myAccountId } = useMyMembership();

  const { thumbnail } = values;

  if (!mediaObjectClass) {
    return <JoyError title={'"Media Object" entity class is undefined'} />;
  }

  if (!entityClass) {
    return <JoyError title={'"Video" entity class is undefined<'} />;
  }

  if (entity && !isAccountAChannelOwner(entity.channel, myAccountId)) {
    return <JoyError title={'Only owner can edit video'} />;
  }

  // Next consts are used in tx params:
  const with_credential = new Option<Credential>(Credential, new Credential(2));
  const as_entity_maintainer = new bool(false);
  const schema_id = new u16(0);

  const entityCodec = new VideoCodec(entityClass);
  const mediaObjectCodec = new MediaObjectCodec(mediaObjectClass);

  const getFieldsValues = (): Partial<FormValues> => {
    const res: Partial<FormValues> = {};

    Object.keys(values).forEach((prop) => {
      const fieldName = prop as VideoPropId;
      const field = Fields[fieldName];
      let fieldValue = values[fieldName] as any;

      let shouldIncludeValue = true;
      if (entity) {
        // If we updating existing entity, then update only changed props:
        shouldIncludeValue = isFieldChanged(fieldName);
      } else if (field.required !== true) {
        // If we creating a new entity, then provide all required props
        // plus non empty non required props:
        if (isInternalProp(field)) {
          shouldIncludeValue = fieldValue > 0;
        } else if (typeof fieldValue === 'string') {
          shouldIncludeValue = nonEmptyStr(fieldValue);
        } else if (Array.isArray(fieldValue) && fieldValue.length === 0) {
          shouldIncludeValue = false;
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
          fieldValue = fieldValue.trim();
        }
        if (isDateField(fieldName)) {
          fieldValue = humanDateToUnixTs(fieldValue);
        }
        res[fieldName] = fieldValue;
      }
    });

    return res;
  };

  const indexOfCreateMediaObjectOperation = new u32(0);

  const indexOfCreateVideoEntityOperation = new u32(2);

  const referToIdOfCreatedMediaObjectEntity = () =>
    ParametrizedEntity.InternalEntityJustAdded(indexOfCreateMediaObjectOperation);

  const referToIdOfCreatedVideoEntity = () =>
    ParametrizedEntity.InternalEntityJustAdded(indexOfCreateVideoEntityOperation);

  const newlyCreatedMediaObjectProp = () => {
    const inClassIndexOfMediaObject = entityCodec.inClassIndexOfProp(Fields.object.id);
    if (!inClassIndexOfMediaObject) {
      throw new Error('Cannot not find an in-class index of "object" prop on Video entity.');
    }

    return new ParametrizedClassPropertyValue({
      in_class_index: new u16(inClassIndexOfMediaObject),
      value: ParametrizedPropertyValue.InternalEntityJustAdded(
        indexOfCreateMediaObjectOperation
      )
    });
  };

  const toParametrizedPropValues = (
    props: VecClassPropertyValue,
    extra: ParametrizedClassPropertyValue[] = []
  ): ParameterizedClassPropertyValues => {
    const parametrizedProps = props.map(p => {
      const { in_class_index, value } = p;
      return new ParametrizedClassPropertyValue({
        in_class_index,
        value: new ParametrizedPropertyValue({ PropertyValue: value })
      });
    });

    if (extra && extra.length) {
      extra.forEach(x => parametrizedProps.push(x));
    }

    return new ParameterizedClassPropertyValues(parametrizedProps);
  };

  const newEntityOperation = (operation_type: OperationType) => {
    return new Operation({
      with_credential,
      as_entity_maintainer,
      operation_type
    });
  };

  const prepareTxParamsForCreateMediaObject = () => {
    return newEntityOperation(
      OperationType.CreateEntity(
        mediaObjectClass.id
      )
    );
  };

  const prepareTxParamsForAddSchemaToMediaObject = () => {
    const propValues = toParametrizedPropValues(
      mediaObjectCodec.toSubstrateUpdate({
        value: contentId!.encode()
      })
    );
    // console.log('prepareTxParamsForAddSchemaToMediaObject:', propValues)

    return newEntityOperation(
      OperationType.AddSchemaSupportToEntity(
        referToIdOfCreatedMediaObjectEntity(),
        schema_id,
        propValues
      )
    );
  };

  const prepareTxParamsForCreateEntity = () => {
    return newEntityOperation(
      OperationType.CreateEntity(
        entityClass.id
      )
    );
  };

  const prepareTxParamsForAddSchemaToEntity = () => {
    const propValues = toParametrizedPropValues(
      entityCodec.toSubstrateUpdate(getFieldsValues()),
      [newlyCreatedMediaObjectProp()]
    );

    // console.log('prepareTxParamsForAddSchemaToEntity:', propValues)

    return newEntityOperation(
      OperationType.AddSchemaSupportToEntity(
        referToIdOfCreatedVideoEntity(),
        schema_id,
        propValues
      )
    );
  };

  const canSubmitTx = () => dirty && isValid && !isSubmitting;

  const buildTransactionTxParams = () => {
    // No need to prepare tx params until the form is valid:
    if (!canSubmitTx()) return [];

    const ops = [
      prepareTxParamsForCreateMediaObject(),
      prepareTxParamsForAddSchemaToMediaObject(),
      prepareTxParamsForCreateEntity(),
      prepareTxParamsForAddSchemaToEntity()
    ];

    // Use for debug:
    // console.log('Batch entity operations:', ops)

    return [new Vec(Operation, ops)];
  };

  const buildUpdateEntityTxParams = () => {
    // No need to prepare tx params until the form is valid:
    if (!canSubmitTx()) return [];

    const updatedPropValues = entityCodec.toSubstrateUpdate(getFieldsValues());
    // console.log('buildUpdateEntityTxParams:', updatedPropValues)

    return [
      with_credential,
      as_entity_maintainer,
      id, // Video Entity Id
      updatedPropValues
    ];
  };

  const redirectToPlaybackPage = (newEntityId?: EntityId) => {
    const entityId = newEntityId || id;
    if (history && entityId) {
      history.push('/media/videos/' + entityId.toString());
    }
  };

  const onCreateEntitySuccess: TxCallback = (txResult: SubmittableResult) => {
    setSubmitting(false);

    // Get id of newly created video entity from the second 'EntityCreated' event,
    // because the first 'EntityCreated' event corresponds to a Media Object Entity.
    const events = filterSubstrateEventsAndExtractData(txResult, 'EntityCreated');

    // Return if there were less than two events:
    if (!events || events.length < 2) return;

    // Get the second 'EntityCreated' event:
    const videoEntityCreatedEvent = events[1];

    // Extract id from from event:
    const newId = videoEntityCreatedEvent[0] as EntityId;
    console.log('New video entity id:', newId && newId.toString());

    redirectToPlaybackPage(newId);
  };

  const onUpdateEntitySuccess: TxCallback = (_txResult: SubmittableResult) => {
    setSubmitting(false);
    redirectToPlaybackPage();
  };

  const basicInfoTab = () => <Tab.Pane as='div'>
    <MediaText field={Fields.title} {...props} />
    <MediaText field={Fields.thumbnail} {...props} />
    <MediaText field={Fields.description} textarea {...props} />
    <MediaDropdown field={Fields.language} options={opts.languageOptions} {...props} />
    <MediaText field={Fields.firstReleased} placeholder={datePlaceholder} {...props} />
    <MediaText field={Fields.explicit} {...props} />
    <MediaDropdown field={Fields.license} options={opts.contentLicenseOptions} {...props} />
    <MediaDropdown field={Fields.publicationStatus} options={opts.publicationStatusOptions} {...props} />
  </Tab.Pane>;

  const additionalTab = () => <Tab.Pane as='div'>
    <MediaDropdown field={Fields.category} options={opts.videoCategoryOptions} {...props} />
    <MediaText field={Fields.links} {...props} />
    <MediaText field={Fields.attribution} {...props} />
  </Tab.Pane>;

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
        Fields.publicationStatus
      ]
    },
    {
      id: 'Additional',
      render: additionalTab,
      fields: [
        Fields.category,
        Fields.links,
        Fields.attribution
      ]
    }
  ]} />;

  const newOnSubmit: OnTxButtonClick = (sendTx: () => void) => {
    // TODO Switch to the first tab with errors if any

    if (onSubmit) {
      onSubmit(sendTx);
    }
  };

  const renderTransactionButton = () =>
    <TxButton
      type='submit'
      size='large'
      isDisabled={!canSubmitTx()}
      label='Publish video'
      tx='versionedStorePermissions.transaction'
      params={buildTransactionTxParams()}
      onClick={newOnSubmit}
      txFailedCb={onTxFailed}
      txSuccessCb={onCreateEntitySuccess}
    />;

  const renderUpdateEntityButton = () =>
    <TxButton
      type='submit'
      size='large'
      isDisabled={!canSubmitTx()}
      label='Update video'
      tx='versionedStorePermissions.updateEntityPropertyValues'
      params={buildUpdateEntityTxParams()}
      onClick={newOnSubmit}
      txFailedCb={onTxFailed}
      txSuccessCb={onUpdateEntitySuccess}
    />;

  return <div className='EditMetaBox'>
    <div className='EditMetaThumb'>
      {thumbnail && <img src={thumbnail} onError={onImageError} />}
    </div>

    <Form className='ui form JoyForm EditMetaForm'>
      {tabs}
      <LabelledField style={{ marginTop: '1rem' }} {...props}>
        {!entity
          ? renderTransactionButton()
          : renderUpdateEntityButton()
        }
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
    const { entity, channelId, fileName } = props;
    const res = VideoToFormValues(entity);
    if (!res.title && fileName) {
      res.title = fileName;
    }
    if (channelId) {
      res.channelId = channelId.toNumber();
    }
    return res;
  },

  validationSchema: () => VideoValidationSchema,

  handleSubmit: () => {
    // do submitting things
  }
})(withMediaForm(InnerForm) as any);

export default EditForm;
