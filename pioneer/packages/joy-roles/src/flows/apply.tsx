import React, { useEffect, useReducer, useState } from 'react';
import { useHistory, Link } from 'react-router-dom';

import { formatBalance } from '@polkadot/util';
import { Balance } from '@polkadot/types/interfaces';
import {
  GenericAccountId,
  u128
} from '@polkadot/types';

import { useMyAccount } from '@polkadot/joy-utils/MyAccountContext';

import {
  Accordion,
  Button,
  Container,
  Form,
  Grid,
  Header,
  Icon,
  Input,
  Label,
  Message,
  Segment,
  SemanticICONS,
  Step,
  Table
} from 'semantic-ui-react';

import Identicon from '@polkadot/react-identicon';
import AccountId from '@polkadot/types/primitive/Generic/AccountId';

import {
  GenericJoyStreamRoleSchema,
  ApplicationDetails,
  QuestionField,
  QuestionSection
} from '@joystream/types/hiring/schemas/role.schema.typings';

import {
  OpeningBodyApplicationsStatus, OpeningStakeAndApplicationStatus,
  ApplicationCount,
  StakeRequirementProps
} from '../tabs/Opportunities';
import { IStakeRequirement } from '../StakeRequirement';

import { Loadable } from '@polkadot/joy-utils/index';
import { Add } from '../balances';

type accordionProps = {
  title: string;
}

function ModalAccordion (props: React.PropsWithChildren<accordionProps>) {
  const [open, setOpen] = useState(false);
  return (
    <Accordion>
      <Accordion.Title index={0} active={open} onClick={() => { setOpen(!open); }} >
        <Icon name='dropdown' />
        {props.title}
      </Accordion.Title>
      <Accordion.Content active={open}>{props.children}</Accordion.Content>
    </Accordion>
  );
}

function KeyPair ({ address, className, style, isUppercase, name, balance }: any): any {
  return (
    <div
      className={['keypair', className].join(' ')}
      style={style}
    >
      <Identicon value={address} size={14} />
      <div className={`name ${isUppercase ? 'uppercase' : 'normalcase'}`}>
        {name}
      </div>
      <div className='balance'>
        {formatBalance(balance)}
      </div>
      <div className='address'>
        {address}
      </div>
    </div>
  );
}

export type keyPairDetails = {
  shortName: string;
  accountId: AccountId;
  balance: Balance;
}

export type FundSourceSelectorProps = {
  keypairs: keyPairDetails[];
  totalStake?: Balance;
}

type FundSourceCallbackProps = {
  addressCallback?: (address: AccountId) => void;
  passphraseCallback?: (passphrase: string) => void;
}

export function FundSourceSelector (props: FundSourceSelectorProps & FundSourceCallbackProps) {
  const pairs: any[] = [];

  const onChangeDropdown = (e: any, { value }: any) => {
    if (typeof props.addressCallback !== 'undefined') {
      props.addressCallback(new GenericAccountId(value));
    }
  };

  const onChangeInput = (e: any, { value }: any) => {
    if (props.passphraseCallback) {
      props.passphraseCallback(value);
    }
  };

  props.keypairs.map((v) => {
    if (props.totalStake && v.balance.lt(props.totalStake)) {
      return;
    }

    pairs.push({
      key: v.shortName,
      text: (
        <KeyPair
          address={v.accountId.toString()}
          name={v.shortName}
          balance={v.balance}
          isUppercase={true}
        />
      ),
      value: v.accountId.toString()
    });
  });

  useEffect(() => {
    if (pairs.length > 0 && typeof props.addressCallback !== 'undefined') {
      props.addressCallback(new GenericAccountId(pairs[0].accountId));
    }
  }, []);

  const accCtx = useMyAccount();
  let passphraseCallback = null;
  if (props.passphraseCallback) {
    passphraseCallback = (
      <Form.Field>
        <label>Unlock key with passphrase</label>
        <Input placeholder='Passphrase'
          type="password"
          onChange={onChangeInput}
        />
      </Form.Field>
    );
  }

  return (
    <Form className="fund-source-selector">
      <Form.Field>
        <label>Select source of funds</label>
        <Form.Dropdown
          placeholder='Source'
          fluid
          selection
          options={pairs}
          onChange={onChangeDropdown}
          defaultValue={accCtx.state.inited ? accCtx.state.address : undefined}
        />
      </Form.Field>
      {passphraseCallback}
    </Form>
  );
}

function rankIcon (estimatedSlot: number, slots: number): SemanticICONS {
  if (estimatedSlot === 1) { // 1st place
    return 'thermometer';
  } else if (estimatedSlot <= (slots / 3)) { // Places 2-33 if slotsCount == 100
    return 'thermometer three quarters';
  } else if (estimatedSlot <= (slots / 1.5)) { // Places 34-66 if slotsCount == 100
    return 'thermometer half';
  } else if (estimatedSlot <= slots) { // Places 67-100 if slotsCount == 100
    return 'thermometer quarter';
  }
  return 'thermometer empty'; // Places >100 for slotsCount == 100
}

export type StakeRankSelectorProps = {
  slots: Balance[]; // List of stakes to beat
  stake: Balance;
  setStake: (b: Balance) => void;
  step: Balance;
  otherStake: Balance;
  requirement: IStakeRequirement;
  maxNumberOfApplications: number;
}

export function StakeRankSelector (props: StakeRankSelectorProps) {
  const slotCount = props.slots.length;
  const minStake = props.maxNumberOfApplications && props.slots.length === props.maxNumberOfApplications
    ? props.slots[0].sub(props.otherStake).addn(1) // Slots are ordered by stake ASC
    : props.requirement.value;
  const stakeSufficient = props.stake.gte(minStake);

  const ticks = [];
  for (let i = 0; i < slotCount; i++) {
    ticks.push(<div key={i} className="tick" style={{ width: (100 / slotCount) + '%' }}>{slotCount - i}</div>);
  }

  let estimatedSlot = slotCount + 1;
  props.slots.forEach(slotStake => props.stake.gt(slotStake.sub(props.otherStake)) && --estimatedSlot);

  const changeValue = (e: any, { value }: any) => {
    const newStake = new u128(value);
    props.setStake(newStake);
  };

  const slider = null;
  return (
    <Container className="stake-rank-selector">
      <h4>Choose a stake</h4>
      <Container className="controls">
        <Input label="JOY"
          labelPosition="right"
          onChange={changeValue}
          type="number"
          step={slotCount > 1 ? props.step.toNumber() : 1}
          value={props.stake.toNumber() > 0 ? props.stake.toNumber() : 0}
          min={minStake}
          error={!stakeSufficient}
        />
        { props.maxNumberOfApplications > 0 && (
          <Label size='large'>
            <Icon name={rankIcon(estimatedSlot, slotCount)} />
            Estimated rank
            <Label.Detail>{estimatedSlot} / {props.maxNumberOfApplications}</Label.Detail>
          </Label>
        ) }
        <Label size='large' color={stakeSufficient ? 'green' : 'red'}>
          <Icon name="shield" />
          Your stake
          <Label.Detail>{formatBalance(props.stake)}</Label.Detail>
        </Label>
      </Container>
      {slider}
      { !stakeSufficient && (
        <Label color="red">Currently you need to stake at least {formatBalance(minStake)} to be considered for this position!</Label>
      ) }
    </Container>
  );
}

export enum ProgressSteps {
  ConfirmStakes = 0,
  ApplicationDetails,
  SubmitApplication,
  Done,
}

export type ProgressStepsProps = {
  activeStep: ProgressSteps;
  hasConfirmStep: boolean;
}

interface ProgressStepDefinition {
  name: string;
  display: boolean;
}
interface ProgressStep extends ProgressStepDefinition {
  active: boolean;
  disabled: boolean;
}

function ProgressStepView (props: ProgressStep) {
  if (!props.display) {
    return null;
  }

  return (
    <Step active={props.active} disabled={props.disabled} key={props.name}>
      <Step.Content>
        <Step.Title>{props.name}</Step.Title>
      </Step.Content>
    </Step>
  );
}

export function ProgressStepsView (props: ProgressStepsProps) {
  const steps: ProgressStepDefinition[] = [
    {
      name: 'Confirm stakes',
      display: props.hasConfirmStep
    },
    {
      name: 'Application details',
      display: true
    },
    {
      name: 'Submit application',
      display: true
    },
    {
      name: 'Done',
      display: true
    }
  ];
  return (
    <Step.Group stackable='tablet'>
      {steps.map((step, key) => (
        <ProgressStepView
          key={key}
          {...step}
          active={key === props.activeStep}
          disabled={key > props.activeStep}
        />
      ))}
    </Step.Group>
  );
}

type CTACallback = () => void

type CTAProps = {
  negativeLabel: string;
  negativeIcon: SemanticICONS;
  negativeCallback: CTACallback;
  positiveLabel: string;
  positiveIcon: SemanticICONS;
  positiveCallback?: CTACallback;
}

function CTA (props: CTAProps) {
  return (
    <Container className="cta">
      <Button
        content={props.negativeLabel}
        icon={props.negativeIcon}
        labelPosition='left'
        onClick={props.negativeCallback}
      />
      <Button
        content={props.positiveLabel}
        icon={props.positiveIcon}
        labelPosition='right'
        positive
        onClick={props.positiveCallback}
        disabled={!props.positiveCallback}
      />
    </Container>
  );
}

function stakeCount (props: StakeRequirementProps): number {
  return (props.requiredApplicationStake.anyRequirement() ? 1 : 0) +
    (props.requiredRoleStake.anyRequirement() ? 1 : 0);
}

function zeroOrTwoStakes (props: StakeRequirementProps): boolean {
  const count = stakeCount(props);
  return (count === 0 || count === 2);
}

function bothStakesVariable (props: StakeRequirementProps): boolean {
  return props.requiredApplicationStake.anyRequirement() && props.requiredRoleStake.anyRequirement() &&
    props.requiredApplicationStake.atLeast() && props.requiredRoleStake.atLeast();
}

export type StageTransitionProps = {
  nextTransition: () => void;
  prevTransition: () => void;
}

type CaptureKeyAndPassphraseProps = {
  keyAddress: AccountId;
  setKeyAddress: (a: AccountId) => void;
  // keyPassphrase: string;
  // setKeyPassphrase: (p: string) => void;
  // minStake: Balance;
}

export type ConfirmStakesStageProps =
  FundSourceSelectorProps &
  Pick<StakeRankSelectorProps, 'slots' | 'step'> & {
    applications: OpeningStakeAndApplicationStatus;
    selectedApplicationStake: Balance;
    setSelectedApplicationStake: (b: Balance) => void;
    selectedRoleStake: Balance;
    setSelectedRoleStake: (b: Balance) => void;
  }

export function ConfirmStakesStage (props: ConfirmStakesStageProps & StageTransitionProps) {
  const ctaContinue = (zeroOrTwoStakes(props.applications))
    ? 'Confirm stakes and continue'
    : 'Confirm stake and continue';

  const continueFn = () => {
    props.nextTransition();
  };

  return (
    <Container className="content">
      <ConfirmStakes {...props} />
      <CTA
        negativeLabel='Cancel'
        negativeIcon='cancel'
        negativeCallback={() => { props.prevTransition(); }}
        positiveLabel={ctaContinue}
        positiveIcon={'right arrow' as SemanticICONS}
        positiveCallback={continueFn}
      />
    </Container>
  );
}

type StakeSelectorProps = ConfirmStakesStageProps;

function ConfirmStakes (props: StakeSelectorProps) {
  if (bothStakesVariable(props.applications)) {
    return <ConfirmStakes2Up {...props} />;
  }

  return <ConfirmStakes1Up {...props} />;
}

function ConfirmStakes1Up (props: StakeSelectorProps) {
  let applicationStake = null;
  if (props.applications.requiredApplicationStake.anyRequirement()) {
    applicationStake = <CaptureStake1Up
      name="application stake"
      stakeReturnPolicy="after the opening is resolved or your application ends"
      colour="yellow"
      requirement={props.applications.requiredApplicationStake}
      value={props.selectedApplicationStake}
      setValue={props.setSelectedApplicationStake}
      maxNumberOfApplications={props.applications.maxNumberOfApplications}
      numberOfApplications={props.applications.numberOfApplications}
      otherStake={props.selectedRoleStake}
      {...props}
    />;
  }

  let roleStake = null;
  if (props.applications.requiredRoleStake.anyRequirement()) {
    roleStake = <CaptureStake1Up
      name="role stake"
      stakeReturnPolicy="after the opening is resolved or your application ends"
      colour="red"
      requirement={props.applications.requiredRoleStake}
      value={props.selectedRoleStake}
      setValue={props.setSelectedRoleStake}
      maxNumberOfApplications={props.applications.maxNumberOfApplications}
      numberOfApplications={props.applications.numberOfApplications}
      otherStake={props.selectedApplicationStake}
      {...props}
    />;
  }

  return (
    <Container className="stakes 1-up">
      {applicationStake}
      {roleStake}
    </Container>
  );
}

export type ConfirmStakes2UpProps = {
  applications: OpeningStakeAndApplicationStatus;
  step: Balance;
  slots: Balance[];
  selectedApplicationStake: Balance;
  setSelectedApplicationStake: (v: Balance) => void;
  selectedRoleStake: Balance;
  setSelectedRoleStake: (v: Balance) => void;
}

export function ConfirmStakes2Up (props: ConfirmStakes2UpProps) {
  const slotCount = props.slots.length;
  const { maxNumberOfApplications, requiredApplicationStake, requiredRoleStake } = props.applications;
  const minStake = maxNumberOfApplications && props.slots.length === maxNumberOfApplications
    ? props.slots[0].addn(1) // Slots are sorted by combined stake ASC
    : requiredApplicationStake.value.add(requiredRoleStake.value);
  const combined = Add(props.selectedApplicationStake, props.selectedRoleStake);
  const valid = combined.gte(minStake);

  let estimatedSlot = slotCount + 1;
  props.slots.forEach(slotStake => combined.gt(slotStake) && --estimatedSlot);

  const ticks = [];
  for (let i = 0; i < slotCount; i++) {
    ticks.push(<div key={i} className="tick" style={{ width: (100 / slotCount) + '%' }}>{i + 1}</div>);
  }

  const tickLabel = <div className="ui pointing below label" style={{ left: ((100 / slotCount) * (estimatedSlot - 1)) + '%' }}>
    Your rank
    <div className="detail">{estimatedSlot}/{props.applications.maxNumberOfApplications}</div>
  </div>;

  let tickContainer = null;
  if (slotCount > 3) {
    tickContainer = (
      <div className="ticks">
        {tickLabel}
        <div className="scale">
          {ticks}
        </div>
      </div>
    );
  }

  let defactoMinStakeMessage = null;
  if (props.applications.numberOfApplications >= props.applications.maxNumberOfApplications) {
    defactoMinStakeMessage = (
      <span>However, in order to be in the top {props.applications.maxNumberOfApplications} applications, you wil need to stake a combined total of more than <strong>{formatBalance(minStake)}</strong>.</span>
    );
  }

  let rankExplanation = <p>This role requires a combined stake (application stake plus role stake) of {formatBalance(minStake)}.</p>;
  if (props.applications.maxNumberOfApplications > 0) {
    rankExplanation = (
      <Container>
        <p>
          Only the top {props.applications.maxNumberOfApplications} applications, ranked by their combined <strong>application state</strong> and <strong>role stake</strong>, will be considered for this role.
        </p>
        <p>
          There is a minimum application stake of {formatBalance(props.applications.requiredApplicationStake.value)} and a minimum role stake of {formatBalance(props.applications.requiredRoleStake.value)} to apply for this role.
          {defactoMinStakeMessage}
        </p>
      </Container>
    );
  }

  return (
    <Container className="confirm-stakes-2up">
      <Message info>
        <Message.Header><Icon name="shield" /> This role requires a minimum combined stake</Message.Header>
        <Message.Content>
          {rankExplanation}
          <Grid stackable className="two-up">
            <Grid.Row columns={2}>
              <Grid.Column>
                <h5>Application stake</h5>
                <p>
                  This role requires an application stake of at least <strong>{formatBalance(props.applications.requiredApplicationStake.value)}</strong>.
                  Along with the role stake, it will be used to rank candidates.
                </p>
                <p>
                  Your application stake will be returned after the opening is resolved or your application ends.
                </p>
              </Grid.Column>
              <Grid.Column>
                <h5>Role stake</h5>
                <p>
                  This role requires a role stake of a least <strong>{formatBalance(props.applications.requiredRoleStake.value)}</strong>.
                  This stake will be returned if your application is unsuccessful, and will also be used to rank applications.
                </p>
                <p>
                  {'If you\'re hired and then withdraw from the role, your role stake will be returned.'}
                </p>
              </Grid.Column>
            </Grid.Row>
            <Grid.Row columns={2}>
              <Grid.Column>
                <StakeRankMiniSelector step={props.step}
                  value={props.selectedApplicationStake}
                  setValue={props.setSelectedApplicationStake}
                  min={props.applications.requiredApplicationStake.value}
                />
              </Grid.Column>
              <Grid.Column>
                <StakeRankMiniSelector step={props.step}
                  value={props.selectedRoleStake}
                  setValue={props.setSelectedRoleStake}
                  min={props.applications.requiredRoleStake.value}
                />
              </Grid.Column>
            </Grid.Row>
            <Grid.Row columns={1}>
              <Grid.Column className="center">
                <Label color='teal'>
                  <Icon name='shield' />
                  Minimum required stake
                  <Label.Detail>{formatBalance(minStake)}</Label.Detail>
                </Label>
                <Label color={valid ? 'green' : 'red'}>
                  <Icon name='times circle' />
                  Your current combined stake
                  <Label.Detail>{formatBalance(new u128(props.selectedApplicationStake.add(props.selectedRoleStake)))}</Label.Detail>
                </Label>
                { maxNumberOfApplications > 0 && (
                  <Label color='grey'>
                    <Icon name={rankIcon(estimatedSlot, slotCount)} />
                    Estimated rank
                    <Label.Detail>{estimatedSlot}/{props.applications.maxNumberOfApplications}</Label.Detail>
                  </Label>
                ) }
              </Grid.Column>
            </Grid.Row>
          </Grid>
          {tickContainer}
        </Message.Content>
      </Message>
    </Container>
  );
}

type StakeRankMiniSelectorProps = {
  setValue: (b: Balance) => void;
  value: Balance;
  step: Balance;
  min: Balance;
}

function StakeRankMiniSelector (props: StakeRankMiniSelectorProps) {
  const changeValue = (e: any, { value }: any) => {
    if (value < 0) {
      props.setValue(new u128(0));
      return;
    }
    const newStake = new u128(value);
    props.setValue(newStake);
  };

  return (
    <Container className="controls">
      <Input label="JOY" fluid
        labelPosition="right"
        onChange={changeValue}
        type="number"
        min={props.min.toNumber()}
        step={props.step.toNumber()}
        value={props.value.toNumber() > 0 ? props.value.toNumber() : null}
        error={props.value.lt(props.min)}
      />
    </Container>
  );
}

type CaptureStake1UpProps = {
  numberOfApplications: number;
  name: string;
  stakeReturnPolicy: string;
  colour: string;
  requirement: IStakeRequirement;
  value: Balance;
  setValue: (b: Balance) => void;
  maxNumberOfApplications: number;
  slots: Balance[]; // List of stakes to beat
  step: Balance;
  otherStake: Balance;
}

// This is not a perfect generator! 'User' would return 'an', for example,
// and 'an user' is incorrect. There is no lightweight method of figuring out
// indefinite articles for English nouns, but it works in the use cases for
// this context, so let's just go with it.
function indefiniteArticle (noun: string): 'a' | 'an' {
  const startsWithVowel = /^([aeiou])/i;
  return startsWithVowel.test(noun) ? 'an' : 'a';
}

function CaptureStake1Up (props: CaptureStake1UpProps) {
  let limit = null;
  if (props.maxNumberOfApplications > 0) {
    limit = (
      <p>
        <span> This will be used to rank candidates, and only the top <strong>{props.maxNumberOfApplications}</strong> will be considered. </span>
        <span> There are currently <strong>{props.numberOfApplications}</strong> applications. </span>
      </p>
    );
  }

  let slider = null;
  let atLeast = null;
  if (props.requirement.atLeast()) {
    slider = <StakeRankSelector
      {...props}
      stake={props.value}
      setStake={props.setValue}
    />;
    atLeast = 'at least ';
  }

  return (
    <Message info={props.colour === 'yellow'} warning={props.colour === 'red'} className={props.name}>
      <Message.Header><Icon name="shield" /> {props.name}</Message.Header>
      <Message.Content>
        <p>
          <span>This role requires {indefiniteArticle(props.name)} <strong>{props.name}</strong> of {atLeast}<strong>{formatBalance(props.requirement.value)}</strong>.</span>
        </p>
        {limit}
        <p>
          Your <strong>{props.name}</strong> will be returned {props.stakeReturnPolicy}.
        </p>
      </Message.Content>
      {slider}
    </Message>
  );
}

function questionHash (section: QuestionSection, question: QuestionField): string {
  return section.title + '|' + question.title;
}

interface FinalDataMap {
  [k: string]: FinalDataMap;
}

function applicationDetailsToObject (input: ApplicationDetails, data: FinalDataMap): any {
  const output: any = {};
  if (!input.sections) {
    return {};
  }
  input.sections.map((section) => {
    section.questions.map((question) => {
      let value: any = '';
      if (data[section.title] && data[section.title][question.title]) {
        value = data[section.title][question.title];
      }
      output[questionHash(section, question)] = value;
    });
  });
  return output;
}

interface QuestionDataMap {
  [k: string]: any;
}

function applicationDetailsToDataObject (input: ApplicationDetails, data: QuestionDataMap): any {
  const output: any = {};
  if (!input.sections) {
    return {};
  }
  input.sections.map((section) => {
    output[section.title] = {};
    section.questions.map((question) => {
      const hash = questionHash(section, question);
      output[section.title][question.title] = data[hash];
    });
  });
  return output;
}

function questionReducer (state: any, action: any) {
  return { ...state, [action.key]: action.value };
}

function questionFieldValueIsValid (question: QuestionField, value: any): boolean {
  switch (question.type) {
    case 'text':
    case 'text area':
      return value !== '';
  }

  return false;
}

export type ApplicationDetailsStageProps = {
  applicationDetails: ApplicationDetails;
  data: object;
  setData: (o: object) => void;
}

export function ApplicationDetailsStage (props: ApplicationDetailsStageProps & StageTransitionProps) {
  const initialForm = applicationDetailsToObject(props.applicationDetails, props.data as FinalDataMap);

  const [data, setData] = useReducer(questionReducer, initialForm);
  const [completed, setCompleted] = useState(false);
  const [valid, setValid] = useState(false);

  const handleChange = (e: any, { name, value }: any) => {
    setCompleted(false);
    setData({ key: name, value: value });
  };

  const questionField = (section: QuestionSection, question: QuestionField, key: any) => {
    switch (question.type) {
      case 'text':
        return <Form.Input value={data[questionHash(section, question)]}
          name={questionHash(section, question)}
          label={question.title}
          onChange={handleChange}
          required
          error={completed && !questionFieldValueIsValid(question, data[questionHash(section, question)])}
          key={key}
        />;

      case 'text area':
        return <Form.TextArea value={data[questionHash(section, question)]}
          name={questionHash(section, question)}
          label={question.title}
          onChange={handleChange}
          required
          error={completed && !questionFieldValueIsValid(question, data[questionHash(section, question)])}
          key={key}
        />;
    }

    return null;
  };

  const isFormValid = (): boolean => {
    let valid = true;

    if (!props.applicationDetails || !props.applicationDetails.sections) {
      return valid;
    }

    props.applicationDetails.sections.map((section) => {
      section.questions.map((question) => {
        if (!questionFieldValueIsValid(question, data[questionHash(section, question)])) {
          valid = false;
        }
      });
    });

    return valid;
  };

  useEffect(() => {
    setValid(isFormValid());
  }, [data]);

  useEffect(() => {
    if (completed === true && valid === true) {
      props.nextTransition();
    }
  }, [completed]);

  const onSubmit = (): void => {
    setCompleted(true);

    if (!valid) {
      return;
    }

    props.setData(applicationDetailsToDataObject(props.applicationDetails, data));
  };

  const onCancel = () => {
    props.setData(applicationDetailsToDataObject(props.applicationDetails, data));
    props.prevTransition();
  };

  return (
    <Container className="content application-questions">
      <Form error={completed && !valid}>
        {props.applicationDetails && props.applicationDetails.sections && props.applicationDetails.sections.map((section, key) => (
          <Segment padded className="section" key={key}>
            <h4><Label attached='top'>{section.title}</Label></h4>
            {section.questions.map((question, key) =>
              questionField(section, question, key)
            )}
          </Segment>
        ))}
        <CTA
          negativeLabel='Back'
          negativeIcon={'left arrow' as SemanticICONS}
          negativeCallback={onCancel}
          positiveLabel='Continue to submit application'
          positiveIcon={'right arrow' as SemanticICONS}
          positiveCallback={onSubmit}
        />

        <Message error>
          Please check all the form fields
        </Message>
      </Form>
    </Container>
  );
}

export type SubmitApplicationStageProps = FundSourceSelectorProps &
StageTransitionProps &
CaptureKeyAndPassphraseProps & {
  transactionDetails: Map<string, string>;
}

export const SubmitApplicationStage = (props: SubmitApplicationStageProps) => {
  const onSubmit = () => {
    props.nextTransition();
  };

  const balanceIsEnough = (): boolean => {
    if (!props.totalStake) {
      return true;
    }

    const idx = props.keypairs.findIndex((a: keyPairDetails) => a.accountId.eq(props.keyAddress));
    if (idx === -1) {
      return false;
    }
    return props.keypairs[idx].balance.gte(props.totalStake);
  };

  return (
    <Container className="content">
      <p>
        You need to make a transaction to apply for this role.
      </p>
      <p>
        Before the transaction, a new account key, called a <em>role key</em>, will be generated and downloaded automatically.
        You will need this role key to perform any duties in the role, so be sure to keep a backup.
      </p>
      <ModalAccordion title="Transaction details">
        <Table basic='very'>
          <Table.Body>
            {[...props.transactionDetails].map((v, k) => (
              <Table.Row key={k}>
                <Table.Cell>{v[0]}</Table.Cell>
                <Table.Cell>{v[1]}</Table.Cell>
              </Table.Row>
            ))}
          </Table.Body>
        </Table>
      </ModalAccordion>

      <Segment>
        <Label attached='top'>Source of funds</Label>
        <p>Please select the account that will be used as the source of funds.</p>
        <FundSourceSelector {...props}
          addressCallback={props.setKeyAddress}
        />
      </Segment>

      <CTA
        negativeLabel='Back'
        negativeIcon={'left arrow' as SemanticICONS}
        negativeCallback={props.prevTransition}
        positiveLabel='Make transaction and submit application'
        positiveIcon={'right arrow' as SemanticICONS}
        positiveCallback={balanceIsEnough() ? onSubmit : undefined}
      />
    </Container>
  );
};

export type DoneStageProps = {
  applications: OpeningStakeAndApplicationStatus;
  roleKeyName: string;
}

export function DoneStage (props: DoneStageProps) {
  return (
    <Container className="content">
      <h4>Application submitted!</h4>
      <p>
        Your application is <strong>#<ApplicationCount {...props.applications} applied={true} /></strong>.
        Once the group lead has started their review, your application will be considered.
      </p>
      <p>
        You can track the progress of your
        application in the <Link to="#working-group/my-roles">My roles and applications</Link> section. Note that your application is attached
        to your role key (see below).  If you have any issues, you can message the group lead in in the <Link to="#forum">Forum</Link> or contact them directly.
      </p>

      <h4>Your new role key</h4>
      <p>
        This role requires a new account, called a <em>role key</em>, which will be used to carry out any duties associated with the role.
      </p>
      <p>
        {'We\'ve generated a new role key, '}<strong>{props.roleKeyName}</strong>, automatically.
        A copy of the backup file should have been downloaded, or you can
        get a backup from the <Link to="/accounts">My account</Link> section.
      </p>
      <p>
        You can also switch your role key using the Accounts selector in the top right of the screen. It works like
        any other account. {'The application you just completed is associated with your new role key, so you\'ll need to '}
        select <strong>{props.roleKeyName}</strong> in the accounts selector in order to track its progress.
      </p>
      <Message warning icon>
        <Icon name='warning sign' />
        <strong>Please make sure to save this file in a secure location as it is the only
          way to restore your role key!</strong>
      </Message>
      <Message warning icon>
        <Icon name='unlock' />
        <strong>
          This role key has been generated with no password!
          We strongly recommend that you set a password for it in the <Link to="/accounts">My account</Link> section.
        </strong>
      </Message>
    </Container>
  );
}

export type FlowModalProps = Pick<StakeRankSelectorProps, 'slots' | 'step'> & FundSourceSelectorProps & {
  role: GenericJoyStreamRoleSchema;
  applications: OpeningStakeAndApplicationStatus;
  hasConfirmStep: boolean;
  prepareApplicationTransaction: (
    applicationStake: Balance,
    roleStake: Balance,
    questionResponses: any,
    txKeyAddress: AccountId,
  ) => Promise<any>;
  makeApplicationTransaction: () => Promise<any>;
  transactionDetails: Map<string, string>;
  roleKeyName: string;

  // IN PROGRESS: state fix
  applicationStake: Balance;
  setApplicationStake: (b: Balance) => void;
  roleStake: Balance;
  setRoleStake: (b: Balance) => void;
  appDetails: any;
  setAppDetails: (v: any) => void;
  txKeyAddress: AccountId;
  setTxKeyAddress: (v: AccountId) => void;
  activeStep: ProgressSteps;
  setActiveStep: (v: ProgressSteps) => void;
  txInProgress: boolean;
  setTxInProgress: (v: boolean) => void;
  complete: boolean;
  setComplete: (v: boolean) => void;
}

export const FlowModal = Loadable<FlowModalProps>(
  [
    'role',
    'applications',
    'keypairs',
    'slots'
  ],
  props => {
    const {
      applicationStake, setApplicationStake,
      roleStake, setRoleStake,
      appDetails, setAppDetails,
      txKeyAddress, setTxKeyAddress,
      activeStep, setActiveStep,
      txInProgress, setTxInProgress,
      complete, setComplete
    } = props;

    const accCtx = useMyAccount();
    if (txKeyAddress.isEmpty) {
      setTxKeyAddress(new AccountId(accCtx.state.address));
    }

    const history = useHistory();
    const cancel = () => {
      if (history.length > 1) {
        history.goBack();
        return;
      }
      history.push('/working-groups/');
    };

    const scrollToTop = () => window.scrollTo(0, 0);

    const enterConfirmStakeState = () => {
      scrollToTop();
      setActiveStep(ProgressSteps.ConfirmStakes);
    };

    const enterApplicationDetailsState = () => {
      scrollToTop();
      setActiveStep(ProgressSteps.ApplicationDetails);
    };

    const enterSubmitApplicationState = () => {
      scrollToTop();
      props.prepareApplicationTransaction(
        applicationStake,
        roleStake,
        appDetails,
        txKeyAddress
      )
        .then(() => {
          setActiveStep(ProgressSteps.SubmitApplication);
        })
        .catch((e) => {
          console.log(e);
        });
    };

    const enterDoneState = () => {
      scrollToTop();
      setTxInProgress(true);
      props.makeApplicationTransaction().then(() => {
        setComplete(true);
        setTxInProgress(false);
        setActiveStep(ProgressSteps.Done);
      })
        .catch((e) => {
          setTimeout(() => setTxInProgress(false), 100);
        });
    };

    const setStakeProps = {
      selectedApplicationStake: applicationStake,
      setSelectedApplicationStake: setApplicationStake,
      selectedRoleStake: roleStake,
      setSelectedRoleStake: setRoleStake
    };

    const stages: { [k in ProgressSteps]: JSX.Element } = {
      [ProgressSteps.ConfirmStakes]: (<ConfirmStakesStage
        {...props}
        nextTransition={enterApplicationDetailsState}
        prevTransition={cancel}
        {...setStakeProps}
      />),

      [ProgressSteps.ApplicationDetails]: (<ApplicationDetailsStage
        setData={setAppDetails}
        data={appDetails}
        applicationDetails={props.role.application}
        nextTransition={enterSubmitApplicationState}
        prevTransition={() => { props.hasConfirmStep ? enterConfirmStakeState() : cancel(); }}
      />),

      [ProgressSteps.SubmitApplication]: (<SubmitApplicationStage
        {...props}
        nextTransition={enterDoneState}
        prevTransition={enterApplicationDetailsState}
        keyAddress={txKeyAddress}
        setKeyAddress={setTxKeyAddress}
        transactionDetails={props.transactionDetails}
        totalStake={Add(applicationStake, roleStake)}
      />),

      [ProgressSteps.Done]: (<DoneStage {...props} roleKeyName={props.roleKeyName} />)
    };

    const cancelText = complete ? 'Close' : 'Cancel application';

    return (
      <Container className="apply-flow">
        <div className="dimmer"></div>
        <Container className="content">
          <Grid columns="equal">
            <Grid.Column width={11} className="title">
              <Label as='h1' color='green' size='huge' ribbon>
                <Icon name='heart' />
                Applying for
                <Label.Detail>{props.role.job.title}</Label.Detail>
              </Label>
            </Grid.Column>
            <Grid.Column width={5} className="cancel">
              <a onClick={() => cancel()}>
                <Icon name='cancel' /> {cancelText}
              </a>
            </Grid.Column>
          </Grid>
          <Grid columns="equal">
            <Grid.Column width={11} className="main">
              <ProgressStepsView activeStep={activeStep} hasConfirmStep={props.hasConfirmStep} />
              {stages[activeStep]}
            </Grid.Column>
            <Grid.Column width={5} className="summary">
              <Header as='h3'>{props.role.headline}</Header>
              <Label as='h1' size='large' ribbon='right' className="fluid standout">
                Reward
                <Label.Detail>{props.role.reward}</Label.Detail>
              </Label>
              <OpeningBodyApplicationsStatus {...props.applications} applied={complete} />
            </Grid.Column>
          </Grid>
        </Container>
        {txInProgress &&
          <div className="loading">
            <div className="spinner"></div>
          </div>
        }
      </Container>
    );
  });
