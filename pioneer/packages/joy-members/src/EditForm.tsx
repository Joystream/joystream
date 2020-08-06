import BN from 'bn.js';
import React from 'react';
import { Link } from 'react-router-dom';
import { Form, Field, withFormik, FormikProps } from 'formik';
import * as Yup from 'yup';

import { Vec } from '@polkadot/types';
import Section from '@polkadot/joy-utils/Section';
import TxButton from '@polkadot/joy-utils/TxButton';
import * as JoyForms from '@polkadot/joy-utils/forms';
import { SubmittableResult } from '@polkadot/api';
import { MemberId, Membership, PaidTermId, PaidMembershipTerms } from '@joystream/types/members';
import { OptionText } from '@joystream/types/common';
import { MyAccountProps, withMyAccount } from '@polkadot/joy-utils/MyAccount';
import { queryMembershipToProp } from './utils';
import { withCalls } from '@polkadot/react-api/index';
import { Button, Message } from 'semantic-ui-react';
import { formatBalance } from '@polkadot/util';
import { TxFailedCallback, TxCallback } from '@polkadot/react-components/Status/types';
import isEqual from 'lodash/isEqual';

// TODO get next settings from Substrate:
const HANDLE_REGEX = /^[a-z0-9_]+$/;

const buildSchema = (p: ValidationProps) =>
  Yup.object().shape({
    handle: Yup.string()
      .matches(HANDLE_REGEX, 'Handle can have only lowercase letters (a-z), numbers (0-9) and underscores (_).')
      .min(p.minHandleLength, `Handle is too short. Minimum length is ${p.minHandleLength} chars.`)
      .max(p.maxHandleLength, `Handle is too long. Maximum length is ${p.maxHandleLength} chars.`)
      .required('Handle is required'),
    avatar: Yup.string()
      .url('Avatar must be a valid URL of an image.')
      .max(p.maxAvatarUriLength, `Avatar URL is too long. Maximum length is ${p.maxAvatarUriLength} chars.`),
    about: Yup.string().max(p.maxAboutTextLength, `Text is too long. Maximum length is ${p.maxAboutTextLength} chars.`)
  });

type ValidationProps = {
  minHandleLength: number;
  maxHandleLength: number;
  maxAvatarUriLength: number;
  maxAboutTextLength: number;
};

type OuterProps = ValidationProps & {
  profile?: Membership;
  paidTerms: PaidMembershipTerms;
  paidTermId: PaidTermId;
  memberId?: MemberId;
};

type FormValues = {
  handle: string;
  avatar: string;
  about: string;
};

type FieldName = keyof FormValues;

type FormProps = OuterProps & FormikProps<FormValues>;

const LabelledField = JoyForms.LabelledField<FormValues>();

const LabelledText = JoyForms.LabelledText<FormValues>();

const InnerForm = (props: FormProps) => {
  const {
    profile,
    paidTerms,
    paidTermId,
    initialValues,
    values,
    touched,
    dirty,
    isValid,
    isSubmitting,
    setSubmitting,
    resetForm,
    memberId
  } = props;

  const onSubmit = (sendTx: () => void) => {
    if (isValid) sendTx();
  };

  const onTxFailed: TxFailedCallback = (txResult: SubmittableResult | null) => {
    setSubmitting(false);
    if (txResult == null) {
      // Tx cancelled.

    }
  };

  const onTxSuccess: TxCallback = (_txResult: SubmittableResult) => {
    setSubmitting(false);
  };

  // TODO extract to forms.tsx
  const isFieldChanged = (field: FieldName): boolean => {
    return dirty && touched[field] === true && !isEqual(values[field], initialValues[field]);
  };

  // TODO extract to forms.tsx
  const fieldToTextOption = (field: FieldName): OptionText => {
    return isFieldChanged(field) ? OptionText.some(values[field]) : OptionText.none();
  };

  const buildTxParams = () => {
    if (!isValid) return [];

    const userInfo = [
      fieldToTextOption('handle'),
      fieldToTextOption('avatar'),
      fieldToTextOption('about')
    ];

    if (profile) {
      // update profile
      return [memberId, ...userInfo];
    } else {
      // register as new member
      return [paidTermId, ...userInfo];
    }
  };

  // TODO show warning that you don't have enough balance to buy a membership

  return (
    <Section title="My Membership Profile">
      <Form className="ui form JoyForm">
        <LabelledText
          name="handle"
          label="Handle/nickname"
          placeholder={'You can use a-z, 0-9 and underscores.'}
          style={{ maxWidth: '30rem' }}
          {...props}
        />
        <LabelledText
          name="avatar"
          label="Avatar URL"
          placeholder="Paste here an URL of your avatar image."
          {...props}
        />
        <LabelledField name="about" label="About" {...props}>
          <Field
            component="textarea"
            id="about"
            name="about"
            disabled={isSubmitting}
            rows={3}
            placeholder="Write here anything you would like to share about yourself with Joystream community."
          />
        </LabelledField>
        {!profile && paidTerms && (
          <Message warning style={{ display: 'block', marginBottom: '0' }}>
            <p>
              Membership costs <b>{formatBalance(paidTerms.fee)}</b> tokens.
            </p>
            <p>
              <span>{'By clicking the "Register" button you agree to our '}</span>
              <Link to={'/pages/tos'}>Terms of Service</Link>
              <span> and </span>
              <Link to={'/pages/privacy'}>Privacy Policy</Link>.
            </p>
          </Message>
        )}
        <LabelledField invisibleLabel {...props}>
          <TxButton
            type="submit"
            size="large"
            label={profile ? 'Update my profile' : 'Register'}
            isDisabled={!dirty || isSubmitting}
            params={buildTxParams()}
            tx={profile ? 'members.updateMembership' : 'members.buyMembership'}
            onClick={onSubmit}
            txFailedCb={onTxFailed}
            txSuccessCb={onTxSuccess}
          />
          <Button
            type="button"
            size="large"
            disabled={!dirty || isSubmitting}
            onClick={() => resetForm()}
            content="Reset form"
          />
        </LabelledField>
      </Form>
    </Section>
  );
};

const EditForm = withFormik<OuterProps, FormValues>({
  // Transform outer props into form values
  mapPropsToValues: props => {
    const { profile: p } = props;
    return {
      handle: p ? p.handle.toString() : '',
      avatar: p ? p.avatar_uri.toString() : '',
      about: p ? p.about.toString() : ''
    };
  },

  validationSchema: buildSchema,

  handleSubmit: values => {
    // do submitting things
  }
})(InnerForm);

type WithMembershipDataProps = {
  memberId?: MemberId;
  membership?: Membership;
  paidTermsId: PaidTermId;
  paidTerms?: PaidMembershipTerms;
  minHandleLength?: BN;
  maxHandleLength?: BN;
  maxAvatarUriLength?: BN;
  maxAboutTextLength?: BN;
};

function WithMembershipDataInner (p: WithMembershipDataProps) {
  const triedToFindProfile = !p.memberId || p.membership;
  if (
    triedToFindProfile &&
    p.paidTerms &&
    p.minHandleLength &&
    p.maxHandleLength &&
    p.maxAvatarUriLength &&
    p.maxAboutTextLength
  ) {
    const membership = p.membership && !p.membership.handle.isEmpty ? p.membership : undefined;

    if (!membership && p.paidTerms.isEmpty) {
      console.error('Could not find active paid membership terms');
    }

    return (
      <EditForm
        minHandleLength={p.minHandleLength.toNumber()}
        maxHandleLength={p.maxHandleLength.toNumber()}
        maxAvatarUriLength={p.maxAvatarUriLength.toNumber()}
        maxAboutTextLength={p.maxAboutTextLength.toNumber()}
        profile={membership}
        paidTerms={p.paidTerms}
        paidTermId={p.paidTermsId}
        memberId={p.memberId}
      />
    );
  } else return <em>Loading...</em>;
}

const WithMembershipData = withCalls<WithMembershipDataProps>(
  queryMembershipToProp('minHandleLength'),
  queryMembershipToProp('maxHandleLength'),
  queryMembershipToProp('maxAvatarUriLength'),
  queryMembershipToProp('maxAboutTextLength'),
  queryMembershipToProp('membershipById', { paramName: 'memberId', propName: 'membership' }),
  queryMembershipToProp('paidMembershipTermsById', { paramName: 'paidTermsId', propName: 'paidTerms' })
)(WithMembershipDataInner);

type WithMembershipDataWrapperProps = MyAccountProps & {
  memberIdsByRootAccountId?: Vec<MemberId>;
  memberIdsByControllerAccountId?: Vec<MemberId>;
  paidTermsIds?: Vec<PaidTermId>;
};

function WithMembershipDataWrapperInner (p: WithMembershipDataWrapperProps) {
  if (p.allAccounts && !Object.keys(p.allAccounts).length) {
    return (
      <Message warning className="JoyMainStatus">
        <Message.Header>Please create a key to get started.</Message.Header>
        <div style={{ marginTop: '1rem' }}>
          <Link to={'/accounts'} className="ui button orange">
            Create key
          </Link>
        </div>
      </Message>
    );
  }

  if (p.memberIdsByRootAccountId && p.memberIdsByControllerAccountId && p.paidTermsIds) {
    if (p.paidTermsIds.length) {
      // let member_ids = p.memberIdsByRootAccountId.slice(); // u8a.subarray is not a function!!
      p.memberIdsByRootAccountId.concat(p.memberIdsByControllerAccountId);
      const memberId = p.memberIdsByRootAccountId.length ? p.memberIdsByRootAccountId[0] : undefined;

      return <WithMembershipData memberId={memberId} paidTermsId={p.paidTermsIds[0]} />;
    } else {
      console.error('Active paid membership terms is empty');
    }
  }

  return <em>Loading...</em>;
}

const WithMembershipDataWrapper = withMyAccount(
  withCalls<WithMembershipDataWrapperProps>(
    queryMembershipToProp('memberIdsByRootAccountId', 'myAddress'),
    queryMembershipToProp('memberIdsByControllerAccountId', 'myAddress'),
    queryMembershipToProp('activePaidMembershipTerms', { propName: 'paidTermsIds' })
  )(WithMembershipDataWrapperInner)
);

export default WithMembershipDataWrapper;
