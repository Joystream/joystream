import React from 'react';
import { Dropdown, DropdownItemProps, DropdownProps } from 'semantic-ui-react';
import { FormikProps, Field } from 'formik';
import * as JoyForms from '@polkadot/joy-utils/forms';
import { SubmittableResult } from '@polkadot/api';
import { TxFailedCallback, TxCallback } from '@polkadot/react-components/Status/types';
import { OnTxButtonClick } from '@polkadot/joy-utils/TxButton';
import isEqual from 'lodash/isEqual';
import { componentName } from '@polkadot/joy-utils/react/helpers';

export type FormCallbacks = {
  onSubmit: OnTxButtonClick;
  onTxSuccess: TxCallback;
  onTxFailed: TxFailedCallback;
};

export type GenericEasyProp<FormValues> = {
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
  field: GenericEasyProp<FormValues>;
};

type EasyTextProps<OuterProps, FormValues> =
  BaseFieldProps<OuterProps, FormValues> & JoyForms.LabelledProps<FormValues>;

type EasyFieldProps<OuterProps, FormValues> =
  BaseFieldProps<OuterProps, FormValues> &
  JoyForms.LabelledProps<FormValues> & {
    fieldProps: any;
  }

type EasyDropdownProps<OuterProps, FormValues> =
  BaseFieldProps<OuterProps, FormValues> &
  {
    options: DropdownItemProps[];
  };

type FormFields<OuterProps, FormValues> = {
  LabelledText: React.FunctionComponent<JoyForms.LabelledProps<FormValues>>;
  LabelledField: React.FunctionComponent<JoyForms.LabelledProps<FormValues>>;
  EasyText: React.FunctionComponent<EasyTextProps<OuterProps, FormValues>>;
  EasyField: React.FunctionComponent<EasyFieldProps<OuterProps, FormValues>>;
  EasyDropdown: React.FunctionComponent<EasyDropdownProps<OuterProps, FormValues>>;
};

export type EasyFormProps<OuterProps, FormValues> =
  OuterProps &
  FormikProps<FormValues> &
  FormFields<OuterProps, FormValues> &
  FormCallbacks & {
    isFieldChanged: (field: keyof FormValues | GenericEasyProp<FormValues>) => boolean;
  };

export function withEasyForm<OuterProps, FormValues>
(Component: React.ComponentType<EasyFormProps<OuterProps, FormValues>>) {
  type FieldName = keyof FormValues

  type FieldObject = GenericEasyProp<FormValues>

  const LabelledText = JoyForms.LabelledText<FormValues>();

  const LabelledField = JoyForms.LabelledField<FormValues>();

  function EasyText (props: EasyTextProps<OuterProps, FormValues>) {
    const { field: f } = props;
    return !f ? null : <LabelledText name={f.id} label={f.name} tooltip={f.description} required={f.required} {...props} />;
  }

  const EasyField = (props: EasyFieldProps<OuterProps, FormValues>) => {
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

  const EasyDropdown = (props: EasyDropdownProps<OuterProps, FormValues>) => {
    const { field: f, options = [] } = props;
    const id = f.id as string;
    const value = (props.values as any)[id] || '';

    return <EasyField {...props} fieldProps={{
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

  const ResultComponent: React.FunctionComponent<EasyFormProps<OuterProps, FormValues>> =
    (props: EasyFormProps<OuterProps, FormValues>) => {
      const {
        initialValues,
        values,
        dirty,
        touched,
        errors,
        isValid,
        setSubmitting
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
        EasyText,
        EasyField,
        EasyDropdown,

        // Other
        isFieldChanged
      };

      return <Component {...allProps} />;
    };
  ResultComponent.displayName = `withEasyForm(${componentName(Component)})`;
  return ResultComponent;
}
