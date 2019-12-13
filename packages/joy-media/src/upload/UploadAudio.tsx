import React from 'react';
import { Button, Tab, Dropdown, DropdownItemProps } from 'semantic-ui-react';
import { Form, Field, withFormik, FormikProps } from 'formik';
import { History } from 'history';

import TxButton from '@polkadot/joy-utils/TxButton';
import { SubmittableResult } from '@polkadot/api';

import * as JoyForms from '@polkadot/joy-utils/forms';
import { ContentId } from '@joystream/types/media';
import { onImageError, DEFAULT_THUMBNAIL_URL } from '../utils';
import { MusicTrackValidationSchema, MusicTrackType, MusicTrackClass as Fields, MusicTrackGenericProp } from '../schemas/music/MusicTrack';
import * as Opts from '../common/DropdownOptions';

type OuterProps = {
  isStorybook?: boolean,
  history?: History,
  contentId: ContentId,
  fileName?: string,
  entity?: MusicTrackType
};

type FormValues = MusicTrackType;

type FormProps = OuterProps & FormikProps<FormValues>;

const LabelledField = JoyForms.LabelledField<FormValues>();

const LabelledText = JoyForms.LabelledText<FormValues>();

const InnerForm = (props: FormProps) => {
  const {
    isStorybook = false,
    history,
    contentId,
    entity,
    values,
    dirty,
    isValid,
    isSubmitting,
    setSubmitting,
    resetForm
  } = props;

  const { trackThumbnail } = values;

  type HasFieldProp = {
    field: MusicTrackGenericProp
  };

  type MediaTextProps = HasFieldProp;

  type MediaFieldProps = HasFieldProp & any;

  type MediaDropdownProps = HasFieldProp & {
    options: DropdownItemProps[]
  };
  
  const MediaText = (fieldProps: MediaTextProps) => {
    const { field: f } = fieldProps;
    return !f ? null : <LabelledText name={f.id} label={f.name} tooltip={f.description} {...props} />;
  }

  const MediaField = (fieldProps: MediaFieldProps) => {
    const { field: f, ...otherProps } = fieldProps;
    return !f ? null : (
      <LabelledField name={f.id} label={f.name} tooltip={f.description} {...props}>
        <Field name={f.id} id={f.id} {...otherProps} />
      </LabelledField>
    );
  }

  const MediaDropdown = (fieldProps: MediaDropdownProps) => {
    const { field: f, options } = fieldProps;
    return !f ? null : (
      <MediaField
        field={f}
        component={Dropdown}
        selection
        options={options}
        disabled={isSubmitting}
      />
    );
  }

  const onSubmit = (sendTx: () => void) => {
    if (isValid) sendTx();
  };

  const onTxCancelled = () => {
    // Nothing yet.
  };

  const onTxFailed = (txResult: SubmittableResult) => {
    setSubmitting(false);
    if (txResult == null) {
      return onTxCancelled();
    }
  };

  const onTxSuccess = (_txResult: SubmittableResult) => {
    setSubmitting(false);
    goToPlayerPage();
  };

  const goToPlayerPage = () => {
    if (history) {
      history.push('/media/play/' + contentId.encode());
    }
  };

  const isNew = !entity;

  const buildTxParams = () => {
    if (!isValid) return [];

    return [ /* TODO save entity to versioned store */ ];
  };

  const basicInfoTab = () => <Tab.Pane as='div'>
    <MediaText field={Fields.trackTitle} />
    <MediaText field={Fields.trackThumbnail} />
    <MediaField field={Fields.aboutTheTrack} component='textarea' rows={3} disabled={isSubmitting} />
    <MediaDropdown field={Fields.publicationStatus} options={Opts.visibilityOptions} />
  </Tab.Pane>

  const additionalTab = () => <Tab.Pane as='div'>
    <MediaText field={Fields.trackArtist} />
    <MediaText field={Fields.composerOrSongwriter} />
    <MediaDropdown field={Fields.genre} options={Opts.genreOptions} />
    <MediaDropdown field={Fields.mood} options={Opts.moodOptions} />
    <MediaDropdown field={Fields.theme} options={Opts.themeOptions} />
    <MediaDropdown field={Fields.license} options={Opts.licenseOptions} />
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

    if (isStorybook) return (
      <Button
        primary
        type='button'
        size='large'
        disabled={isDisabled}
        content={label}
      />
    );

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
      {trackThumbnail && <img src={trackThumbnail} onError={onImageError} />}
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
      trackTitle: entity && entity.trackTitle || fileName || '',
      aboutTheTrack: entity && entity.aboutTheTrack || '',
      trackThumbnail: entity && entity.trackThumbnail || DEFAULT_THUMBNAIL_URL,
      publicationStatus: entity && entity.publicationStatus || Opts.visibilityOptions[0].value,
      album: entity && entity.album || '',

      // Additional:
      trackArtist: entity && entity.trackArtist || '',
      composerOrSongwriter: entity && entity.composerOrSongwriter || '',
      genre: entity && entity.genre || Opts.genreOptions[0].value,
      mood: entity && entity.mood || Opts.moodOptions[0].value,
      theme: entity && entity.theme || Opts.themeOptions[0].value,
      explicit: entity && entity.explicit || false, // TODO explicitOptions[0].value,
      license: entity && entity.license || Opts.licenseOptions[0].value,
    };
  },

  validationSchema: () => MusicTrackValidationSchema,

  handleSubmit: () => {
    // do submitting things
  }
})(InnerForm);

export default EditForm;
