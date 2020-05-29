import React, { useState, useContext, createContext } from 'react';
import { Button } from 'semantic-ui-react';
import { Form, Field, withFormik, FormikProps, FieldProps } from 'formik';
import * as Yup from 'yup';

import TxButton from '@polkadot/joy-utils/TxButton';
import { SubmittableResult } from '@polkadot/api';
import { InputAddress } from '@polkadot/react-components/index';
import { withMulti } from '@polkadot/react-api/with';

import * as JoyForms from '@polkadot/joy-utils/forms';
import { Option } from '@polkadot/types/codec';
import Section from '@polkadot/joy-utils/Section';
import { useMyAccount } from '@polkadot/joy-utils/MyAccountContext';
import { withOnlySudo } from '@polkadot/joy-utils/Sudo';
import { AccountId } from '@polkadot/types/interfaces';
import { JoyError } from '@polkadot/joy-utils/JoyStatus';
import AddressMini from '@polkadot/react-components/AddressMiniJoy';
import { withForumCalls } from './calls';
import { TxFailedCallback, TxCallback } from '@polkadot/react-components/Status/types';

const buildSchema = () => Yup.object().shape({});

type OuterProps = {
  currentSudo?: string
};

type FormValues = {
  sudo?: string
};

type FormProps = OuterProps & FormikProps<FormValues>;

const LabelledField = JoyForms.LabelledField<FormValues>();

const InnerForm = (props: FormProps) => {
  const {
    currentSudo,
    values,
    dirty,
    isValid,
    isSubmitting,
    setSubmitting
  } = props;

  const {
    sudo
  } = values;

  const [ showSelector, setShowSelector ] = useState(false);

  const resetForm = () => {
    setShowSelector(false);
    props.resetForm();
  };

  const onSubmit = (sendTx: () => void) => {
    if (isValid) sendTx();
  };

  const onTxFailed: TxFailedCallback = (txResult: SubmittableResult | null) => {
    setSubmitting(false);
    if (txResult == null) {
      // Tx cancelled.
      return;
    }
  };

  const onTxSuccess: TxCallback = (_txResult: SubmittableResult) => {
    setSubmitting(false);
    resetForm();
  };

  const isNotSet = currentSudo === undefined;

  const buildTxParams = () => {
    if (!isValid) return [];
    return [ new Option('AccountId', sudo) ];
  };

  type SudoInputAddressProps = FieldProps<FormValues>; /* & InputAddressProps*/;

  const SudoInputAddress = ({ field, form, ...props }: SudoInputAddressProps) => {
    const { name, value } = field;

    const onChange = (address: string | null) => {
      address !== value && form.setFieldValue(name, address);
    };

    return (
      <InputAddress
        {...props}
        // name={name}
        value={value}
        onChange={onChange}
        withLabel={false}
      />
    );
  };

  const form = () => (
    <Form className='ui form JoyForm EditEntityForm'>

      <LabelledField name='sudo' {...props}>
        <Field component={SudoInputAddress} id='sudo' name='sudo' disabled={isSubmitting} />
      </LabelledField>

      <LabelledField {...props}>
        <TxButton
          type='submit'
          size='large'
          label={isNotSet
            ? 'Set forum sudo'
            : 'Update forum sudo'
          }
          isDisabled={!dirty || isSubmitting}
          params={buildTxParams()}
          tx={`forum.setForumSudo`}
          onClick={onSubmit}
          txFailedCb={onTxFailed}
          txSuccessCb={onTxSuccess}
        />
        <Button
          type='button'
          size='large'
          disabled={!dirty || isSubmitting}
          onClick={resetForm}
          content='Reset form'
        />
      </LabelledField>
    </Form>
  );

  return showSelector
    ? (
      <Section className='EditEntityBox'>
        {form()}
      </Section>
    )
    : (<>
      {currentSudo && <p><AddressMini value={currentSudo} /></p>}
      <Button
        type='button'
        size='large'
        onClick={() => setShowSelector(true)}
        content={`${currentSudo ? 'Edit' : 'Set'} forum sudo`}
      />
    </>);
};

const EditForm = withFormik<OuterProps, FormValues>({

  // Transform outer props into form values
  mapPropsToValues: props => {
    const { currentSudo } = props;
    return {
      sudo: currentSudo
    };
  },

  validationSchema: buildSchema,

  handleSubmit: values => {
    // do submitting things
  }
})(InnerForm);

type LoadStructProps = {
  structOpt: Option<AccountId>
};

const withLoadForumSudo = withForumCalls<LoadStructProps>(
  ['forumSudo', { propName: 'structOpt' }]
);

function InjectCurrentSudo (props: LoadStructProps) {
  const { structOpt } = props;
  if (!structOpt) {
    return <em>Loading forum sudo...</em>;
  }

  const sudo = structOpt.isSome ? structOpt.unwrap().toString() : undefined;
  return <EditForm currentSudo={sudo} />;
}

export const EditForumSudo = withMulti(
  InjectCurrentSudo,
  withOnlySudo,
  withLoadForumSudo
);

export function withOnlyForumSudo<P extends {}> (Component: React.ComponentType<P>) {
  return withMulti(
    Component,
    withLoadForumSudo,
    innerWithOnlyForumSudo
  );
}

function innerWithOnlyForumSudo<P extends LoadStructProps> (Component: React.ComponentType<P>) {
  return function (props: P) {
    const { structOpt } = props;
    if (!structOpt) {
      return <em>Loading forum sudo...</em>;
    }

    const sudo = structOpt.isSome ? structOpt.unwrap().toString() : undefined;
    const { state: { address: myAddress } } = useMyAccount();
    const iAmForumSudo = sudo === myAddress;

    if (iAmForumSudo) {
      return <Component {...props} />;
    } else {
      return (
        <JoyError title={`Only forum sudo can access this functionality.`}>
          <div>Current forum sudo:</div>
          <div>{sudo ? <AddressMini value={sudo} /> : 'UNDEFINED'}</div>
        </JoyError>
      );
    }
  };
}

type ForumSudoContextProps = {
  forumSudo?: AccountId
};

export const ForumSudoContext = createContext<ForumSudoContextProps>({});

export const ForumSudoProvider = withMulti(
  InnerForumSudoProvider,
  withLoadForumSudo
);

export function InnerForumSudoProvider (props: React.PropsWithChildren<LoadStructProps>) {
  const { structOpt } = props;
  const forumSudo = structOpt ? structOpt.unwrapOr(undefined) : undefined;
  return (
    <ForumSudoContext.Provider value={{ forumSudo }}>
      {props.children}
    </ForumSudoContext.Provider>
  );
}

export function useForumSudo () {
  return useContext(ForumSudoContext);
}

export const IfIAmForumSudo = (props: React.PropsWithChildren<any>) => {
  const { forumSudo } = useForumSudo();
  const { state: { address: myAddress } } = useMyAccount();
  const iAmForumSudo: boolean = forumSudo !== undefined && forumSudo.eq(myAddress);
  return iAmForumSudo ? props.children : null;
};
