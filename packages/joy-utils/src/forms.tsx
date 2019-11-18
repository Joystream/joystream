import React from 'react';
import { Field, ErrorMessage, FormikErrors, FormikTouched } from 'formik';

import { BareProps } from '@polkadot/react-components/types';
import { nonEmptyStr } from '@polkadot/joy-utils/index';
import { Popup, Icon } from 'semantic-ui-react';

type FormValuesType = {
  [s: string]: string
};

type LabelledProps<FormValues = FormValuesType> = BareProps & {
  name?: keyof FormValues,
  label?: React.ReactNode,
  invisibleLabel?: boolean,
  placeholder?: string,
  tooltip?: React.ReactNode,
  style?: React.CSSProperties,
  children?: JSX.Element | JSX.Element[],
  errors: FormikErrors<FormValues>,
  touched: FormikTouched<FormValues>,
  isSubmitting: boolean
};

export function LabelledField<FormValues = FormValuesType> () {
  return (props: LabelledProps<FormValues>) => {
    const { name, label, invisibleLabel = false, tooltip, touched, errors, children, style } = props;
    const hasError = name && touched[name] && errors[name];

    const fieldWithError = <>
      <div>{children}</div>
      {name && <ErrorMessage name={name as string} component='div' className='ui pointing red label' />}
    </>;
    
    return (label || invisibleLabel)
      ? <div style={style} className={`ui--Labelled field ${hasError ? 'error' : ''}`}>
          <label htmlFor={name as string}>
            {nonEmptyStr(label) && label}
            {tooltip && <FieldTooltip>{tooltip}</FieldTooltip> }
          </label>
          <div className='ui--Labelled-content'>
            {fieldWithError}
          </div>
        </div>
      : <div style={style} className={`field ${hasError ? 'error' : ''}`}>
          {fieldWithError}
        </div>;
  };
}

export function LabelledText<FormValues = FormValuesType> () {
  const LF = LabelledField<FormValues>();
  return (props: LabelledProps<FormValues>) => {
    const { name, placeholder, className, style, ...otherProps } = props;
    const fieldProps = { className, style, name, placeholder };
    return <LF name={name} {...otherProps} >
      <Field id={name} disabled={otherProps.isSubmitting} {...fieldProps} />
    </LF>;
  };
}

type FieldTooltipProps = {
  children: React.ReactNode
}

export const FieldTooltip = (props: FieldTooltipProps) => {
  return <Popup
    trigger={<Icon name='question' circular size='small' style={{ marginLeft: '.25rem' }} />}
    content={props.children}
    position='right center'
  />;
}