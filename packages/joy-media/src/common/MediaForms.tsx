import React from 'react';
import { Dropdown, DropdownItemProps, DropdownProps } from 'semantic-ui-react';
import { FormikProps, Field } from 'formik';
import * as JoyForms from '@polkadot/joy-utils/forms';
import { SubmittableResult } from '@polkadot/api';
import { TxFailedCallback, TxCallback } from '@polkadot/react-components/Status/types';

type FormCallbacks = {
  onSubmit: (sendTx: () => void) => void,
  onTxSuccess: TxCallback,
  onTxFailed: TxFailedCallback
};

type GenericMediaProp<FormValues> = {
  id: keyof FormValues,
  type: string,
  name: string,
  description?: string,
  required?: boolean,
  maxItems?: number,
  maxTextLength?: number,
  classId?: any
};

type BaseFieldProps<OuterProps, FormValues> = OuterProps & FormikProps<FormValues> & {
  field: GenericMediaProp<FormValues>
};

type MediaTextProps<OuterProps, FormValues> =
  BaseFieldProps<OuterProps, FormValues> & JoyForms.LabelledProps<FormValues>;

type MediaFieldProps<OuterProps, FormValues> =
  BaseFieldProps<OuterProps, FormValues> &
  JoyForms.LabelledProps<FormValues> & {
    fieldProps: any
  }

type MediaDropdownProps<OuterProps, FormValues> =
  BaseFieldProps<OuterProps, FormValues> &
{
  options: DropdownItemProps[]
};

type FormFields<OuterProps, FormValues> = {
  LabelledText: React.FunctionComponent<JoyForms.LabelledProps<FormValues>>
  LabelledField: React.FunctionComponent<JoyForms.LabelledProps<FormValues>>
  MediaText: React.FunctionComponent<MediaTextProps<OuterProps, FormValues>>
  MediaField: React.FunctionComponent<MediaFieldProps<OuterProps, FormValues>>
  MediaDropdown: React.FunctionComponent<MediaDropdownProps<OuterProps, FormValues>>
};

export type MediaFormProps<OuterProps, FormValues> =
  OuterProps &
  FormikProps<FormValues> &
  FormFields<OuterProps, FormValues> &
  FormCallbacks;

export function withMediaForm<OuterProps, FormValues>
  (Component: React.ComponentType<MediaFormProps<OuterProps, FormValues>>)
{
  const LabelledText = JoyForms.LabelledText<FormValues>();
  
  const LabelledField = JoyForms.LabelledField<FormValues>();
  
  function MediaText (props: MediaTextProps<OuterProps, FormValues>) {
    const { field: f } = props;
    return !f ? null : <LabelledText name={f.id} label={f.name} tooltip={f.description} required={f.required} {...props} />;
  }

  const MediaField = (props: MediaFieldProps<OuterProps, FormValues>) => {
    const { field: f, fieldProps = {}, placeholder, className, style, ...otherProps } = props;

    const { id } = f;

    const allFieldProps = {
      name: id, id, placeholder, className, style, 
      disabled: otherProps.isSubmitting,
      ...fieldProps
    };

    return !f ? null : (
      <LabelledField name={id} label={f.name} tooltip={f.description} required={f.required} {...props}>
        <Field {...allFieldProps} />
      </LabelledField>
    );
  }

  const MediaDropdown = (props: MediaDropdownProps<OuterProps, FormValues>) => {
    const { field: f, options = [] } = props;
    const id = f.id as string;
    const value = (props.values as any)[id] || '';

    return <MediaField {...props} fieldProps={{
      component: Dropdown,
      selection: true,
      options,
      value,
      onBlur: (_event: any, data: DropdownProps) => {
        props.setFieldTouched(id, true);
      },
      onChange: (_event: any, data: DropdownProps) => {
        props.setFieldValue(id, data.value || '');
      }
    }} />
  }

  return function (props: MediaFormProps<OuterProps, FormValues>) {
    const {
      isValid,
      setSubmitting
    } = props;

    const onSubmit = (sendTx: () => void) => {
      if (isValid) sendTx();
    };
    
    const onTxSuccess: TxCallback = (_txResult: SubmittableResult) => {
      setSubmitting(false);
    };

    const onTxFailed: TxFailedCallback = (txResult: SubmittableResult | null) => {
      setSubmitting(false);
      if (txResult === null) {
        // Tx cancelled
        return;
      }
    };

    const allProps = {
      ...props,

      // Callbacks:
      onSubmit,
      onTxSuccess,
      onTxFailed,

      // Components:
      LabelledText,
      LabelledField,
      MediaText,
      MediaField,
      MediaDropdown
    }

    return <Component {...allProps} />;
  };
}
