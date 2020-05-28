import React from 'react';
import { Field, FormikErrors, FormikTouched } from 'formik';

import { nonEmptyStr } from '@polkadot/joy-utils/index';
import { Popup, Icon } from 'semantic-ui-react';

export type LabelledProps<FormValues> = {
  name?: keyof FormValues;
  label?: React.ReactNode;
  invisibleLabel?: boolean;
  placeholder?: string;
  tooltip?: React.ReactNode;
  textarea?: boolean;
  required?: boolean;
  className?: string;
  style?: React.CSSProperties;
  children?: React.ReactNode;
  errors: FormikErrors<FormValues>;
  touched: FormikTouched<FormValues>;
  isSubmitting: boolean;
};

export function LabelledField<FormValues> () {
  const LabelledFieldInner: React.FunctionComponent<LabelledProps<FormValues>> =
    (props: LabelledProps<FormValues>) => {
      const { name, label, invisibleLabel = false, tooltip, required = false, touched, errors, children, style } = props;

      const hasError = name && touched[name] && errors[name];

      const errorClass = hasError ? 'error' : '';

      const fieldWithError =
        <>
          <div>{children}</div>
          {name && hasError && <div className='ui pointing red label'>{errors[name]}</div>}
        </>;

      const renderLabel = () =>
        nonEmptyStr(label)
          ? <>
              {required && <b style={{ color: 'red' }} title='This field is required'>* </b>}
              {label}
            </>
          : null;

      return (label || invisibleLabel)
        ? <div style={style} className={`ui--Labelled field ${errorClass}`}>
          <label htmlFor={name as string}>
            {renderLabel()}
            {tooltip && <FieldTooltip>{tooltip}</FieldTooltip> }
          </label>
          <div className='ui--Labelled-content'>
            {fieldWithError}
          </div>
        </div>
        : <div style={style} className={`field ${errorClass}`}>
          {fieldWithError}
        </div>;
    };
  return LabelledFieldInner;
}

export function LabelledText<FormValues> () {
  const LF = LabelledField<FormValues>();

  return (props: LabelledProps<FormValues>) => {
    const { name, placeholder, textarea = false, className, style, ...otherProps } = props;

    const textareaProps = !textarea ? {} : {
      component: 'textarea',
      rows: 3
    };

    const fieldProps = {
      id: name,
      name,
      placeholder,
      className,
      style,
      disabled: otherProps.isSubmitting,
      ...textareaProps
    };

    return <LF name={name} {...otherProps} >
      <Field {...fieldProps} />
    </LF>;
  };
}

type FieldTooltipProps = {
  children: React.ReactNode;
}

export const FieldTooltip = (props: FieldTooltipProps) => {
  return <Popup
    trigger={<Icon name='question' circular size='small' style={{ marginLeft: '.25rem' }} />}
    content={props.children}
    position='right center'
  />;
};
