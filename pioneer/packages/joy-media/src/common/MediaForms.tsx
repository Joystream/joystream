import React from 'react';
import { Dropdown, DropdownItemProps, DropdownProps } from 'semantic-ui-react';
import { FormikProps, Field } from 'formik';
import * as JoyForms from '@polkadot/joy-utils/forms';
import { SubmittableResult } from '@polkadot/api';
import { TxFailedCallback, TxCallback } from '@polkadot/react-components/Status/types';
import { MediaDropdownOptions } from './MediaDropdownOptions';
import { OnTxButtonClick } from '@polkadot/joy-utils/TxButton';
import isEqual from 'lodash/isEqual';
import { componentName } from '@polkadot/joy-utils/react/helpers';

export const datePlaceholder = 'Date in format yyyy-mm-dd';

export type FormCallbacks = {
  onSubmit: OnTxButtonClick;
  onTxSuccess: TxCallback;
  onTxFailed: TxFailedCallback;
};

export type GenericMediaProp<FormValues> = {
  id: keyof FormValues;
  type: string;
  name: string;
  description?: string;
  required?: boolean;
  minItems?: number;
  maxItems?: number;
  minTextLength?: number;
  maxTextLength?: number;
  classId?: any;
};

type BaseFieldProps<OuterProps, FormValues> = OuterProps & FormikProps<FormValues> & {
  field: GenericMediaProp<FormValues>;
};

type MediaTextProps<OuterProps, FormValues> =
  BaseFieldProps<OuterProps, FormValues> & JoyForms.LabelledProps<FormValues>;

type MediaFieldProps<OuterProps, FormValues> =
  BaseFieldProps<OuterProps, FormValues> &
  JoyForms.LabelledProps<FormValues> & {
    fieldProps: any;
  }

type MediaDropdownProps<OuterProps, FormValues> =
  BaseFieldProps<OuterProps, FormValues> &
  {
    options: DropdownItemProps[];
  };

type FormFields<OuterProps, FormValues> = {
  LabelledText: React.FunctionComponent<JoyForms.LabelledProps<FormValues>>;
  LabelledField: React.FunctionComponent<JoyForms.LabelledProps<FormValues>>;
  MediaText: React.FunctionComponent<MediaTextProps<OuterProps, FormValues>>;
  MediaField: React.FunctionComponent<MediaFieldProps<OuterProps, FormValues>>;
  MediaDropdown: React.FunctionComponent<MediaDropdownProps<OuterProps, FormValues>>;
};

export type MediaFormProps<OuterProps, FormValues> =
  OuterProps &
  FormikProps<FormValues> &
  FormFields<OuterProps, FormValues> &
  FormCallbacks & {
    opts: MediaDropdownOptions;
    isFieldChanged: (field: keyof FormValues | GenericMediaProp<FormValues>) => boolean;
  };

export function withMediaForm<OuterProps, FormValues>
(Component: React.ComponentType<MediaFormProps<OuterProps, FormValues>>) {
  type FieldName = keyof FormValues

  type FieldObject = GenericMediaProp<FormValues>

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
      name: id,
      id,
      placeholder,
      className,
      style,
      disabled: otherProps.isSubmitting,
      ...fieldProps
    };

    return !f ? null : (
      <LabelledField name={id} label={f.name} tooltip={f.description} required={f.required} {...props}>
        <Field {...allFieldProps} />
      </LabelledField>
    );
  };

  const MediaDropdown = (props: MediaDropdownProps<OuterProps, FormValues>) => {
    const { field: f, options = [] } = props;
    const id = f.id as string;
    const value = (props.values as any)[id] || '';

    return <MediaField {...props} fieldProps={{
      component: Dropdown,
      selection: true,
      search: true,
      options,
      value,
      onBlur: (_event: any, _data: DropdownProps) => {
        props.setFieldTouched(id, true);
      },
      onChange: (_event: any, data: DropdownProps) => {
        props.setFieldValue(id, data.value);
      }
    }} />;
  };

  const ResultComponent: React.FunctionComponent<MediaFormProps<OuterProps, FormValues>> =
    (props: MediaFormProps<OuterProps, FormValues>) => {
      const {
        initialValues,
        values,
        dirty,
        touched,
        errors,
        isValid,
        setSubmitting,
        opts = MediaDropdownOptions.Empty
      } = props;

      const isFieldChanged = (field: FieldName | FieldObject): boolean => {
        const fieldName = typeof field === 'string' ? field : (field as FieldObject).id;
        return (
          dirty &&
          touched[fieldName] === true &&
          !isEqual(values[fieldName], initialValues[fieldName])
        );
      };

      const onSubmit = (sendTx: () => void) => {
        if (isValid) {
          sendTx();
        } else {
          console.log('Form is invalid. Errors:', errors);
        }
      };

      const onTxSuccess: TxCallback = (_txResult: SubmittableResult) => {
        setSubmitting(false);
      };

      const onTxFailed: TxFailedCallback = (txResult: SubmittableResult | null) => {
        setSubmitting(false);
        if (txResult === null) {
          // Tx cancelled

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
        MediaDropdown,

        // Other
        opts,
        isFieldChanged
      };

      return <Component {...allProps} />;
    };
  ResultComponent.displayName = `withMediaForm(${componentName(Component)})`;
  return ResultComponent;
}
