import React, { useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { formatBalance } from '@polkadot/util';

import { ApiPromise } from '@polkadot/api';
import { GenericAccountId, Option, Text, Vec, u32, u128 } from '@polkadot/types';
import { Balance } from '@polkadot/types/interfaces';

import { SingleLinkedMapEntry, Controller, View } from '@polkadot/joy-utils/index';
import { useMyAccount } from '@polkadot/joy-utils/MyAccountContext';
import { SubmittableExtrinsic } from '@polkadot/api/promise/types';
import { QueueTxExtrinsicAdd } from '@polkadot/react-components/Status/types';

import {
  Accordion,
  Button,
  Card,
  Checkbox,
  Container,
  Dropdown,
  Form,
  Grid,
  Icon,
  Input,
  Label,
  Message,
  Modal,
  Table,
  TextArea
} from 'semantic-ui-react';

import { ITransport } from '../transport';

import {
  Application,
  ApplicationStage,
  ActivateOpeningAt,
  ApplicationRationingPolicy,
  CurrentBlock,
  Opening,
  OpeningStage,
  StakingPolicy,
  StakingAmountLimitModeKeys,
  StakingAmountLimitMode
} from '@joystream/types/hiring';

import {
  Membership,
  MemberId
} from '@joystream/types/members';

import { Stake, StakeId } from '@joystream/types/stake';

import {
  CuratorApplication, CuratorApplicationId,
  CuratorOpening,
  IOpeningPolicyCommitment, CuratorOpeningId
} from '@joystream/types/content-working-group';

import {
  classifyOpeningStage,
  OpeningStageClassification,
  OpeningState
} from '../classifiers';

import {
  openingDescription
} from '../openingStateMarkup';

import { Add, Zero } from '../balances';

type ids = {
  curatorId: number;
  openingId: number;
}

type application = ids & {
  account: string;
  memberId: number;
  profile: Membership;
  stage: ApplicationStage;
  applicationStake: Balance;
  roleStake: Balance;
  application: Application;
}

type opening = ids & {
  title: string;
  state: OpeningStage;
  applications: Array<application>;
  classification: OpeningStageClassification;
}

// Only max_review_period_length is not optional, so other fields can be "undefined"
type policyDescriptor = Pick<IOpeningPolicyCommitment, 'max_review_period_length'> & Partial<IOpeningPolicyCommitment>;

type stakingFieldName = 'application_staking_policy' | 'role_staking_policy';

type openingDescriptor = {
  title: string;
  start: ActivateOpeningAt;
  policy: policyDescriptor;
  text: Text;
}

type State = {
  openings: Map<number, opening>;
  currentDescriptor: openingDescriptor;
  modalOpen: boolean;
}

function newHRT (title: string): Text {
  return new Text(JSON.stringify({
    version: 1,
    headline: 'some headline',
    job: {
      title: title,
      description: 'some job description'
    },
    application: {
      sections: [
        {
          title: 'About you',
          questions: [
            {
              title: 'your name',
              type: 'text'
            }
          ]
        },
        {
          title: 'Something else',
          questions: [
            {
              title: 'another thing',
              type: 'text area'
            }
          ]
        }
      ]
    },
    reward: '10 JOY per block',
    creator: {
      membership: {
        handle: 'ben'
      }
    },
    process: {
      details: [
        'Some custom detail'
      ]
    }
  })
  );
}

const createRationingPolicyOpt = (maxApplicants: number) =>
  new Option<ApplicationRationingPolicy>(
    ApplicationRationingPolicy,
    new ApplicationRationingPolicy({
      max_active_applicants: new u32(maxApplicants)
    })
  );
const createStakingPolicyOpt = (amount: number, amount_mode: StakingAmountLimitMode): Option<StakingPolicy> =>
  new Option(
    StakingPolicy,
    new StakingPolicy({
      amount: new u128(amount),
      amount_mode,
      crowded_out_unstaking_period_length: new Option('BlockNumber', null),
      review_period_expired_unstaking_period_length: new Option('BlockNumber', null)
    })
  );

const STAKING_MODE_EXACT = new StakingAmountLimitMode(StakingAmountLimitModeKeys.Exact);
const STAKING_MODE_AT_LEAST = new StakingAmountLimitMode(StakingAmountLimitModeKeys.AtLeast);

const stockOpenings: openingDescriptor[] = [
  {
    title: 'Test config A: no application stake, no role stake, no applicant limit',
    start: new ActivateOpeningAt(CurrentBlock),
    policy: {
      max_review_period_length: new u32(99999)
    },
    text: newHRT('Test configuration A')
  },
  {
    title: 'Test config B: no application stake, no role stake, 10 applicant limit',
    start: new ActivateOpeningAt(CurrentBlock),
    policy: {
      max_review_period_length: new u32(99999)
    },
    text: newHRT('Test configuration B')
  },
  {
    title: 'Test config C: fixed application stake (100), no role stake, no applicant limit',
    start: new ActivateOpeningAt(CurrentBlock),
    policy: {
      max_review_period_length: new u32(99999),
      application_staking_policy: createStakingPolicyOpt(100, STAKING_MODE_EXACT)
    },
    text: newHRT('Test configuration C')
  },
  {
    title: 'Test config D: fixed application stake (100), no role stake, 10 applicant limit',
    start: new ActivateOpeningAt(CurrentBlock),
    policy: {
      max_review_period_length: new u32(99999),
      application_rationing_policy: createRationingPolicyOpt(10),
      application_staking_policy: createStakingPolicyOpt(100, STAKING_MODE_EXACT)
    },
    text: newHRT('Test configuration D')
  },
  {
    title: 'Test config E: no application stake, fixed role stake (100), no applicant limit',
    start: new ActivateOpeningAt(CurrentBlock),
    policy: {
      max_review_period_length: new u32(99999),
      role_staking_policy: createStakingPolicyOpt(100, STAKING_MODE_EXACT)
    },
    text: newHRT('Test configuration E')
  },
  {
    title: 'Test config F: no application stake, fixed role stake (100), 10 applicant limit',
    start: new ActivateOpeningAt(CurrentBlock),
    policy: {
      max_review_period_length: new u32(99999),
      application_rationing_policy: createRationingPolicyOpt(10),
      role_staking_policy: createStakingPolicyOpt(100, STAKING_MODE_EXACT)
    },
    text: newHRT('Test configuration F')
  },
  {
    title: 'Test config G: minimum application stake (100), no role stake, no applicant limit',
    start: new ActivateOpeningAt(CurrentBlock),
    policy: {
      max_review_period_length: new u32(99999),
      application_staking_policy: createStakingPolicyOpt(100, STAKING_MODE_AT_LEAST)
    },
    text: newHRT('Test configuration G')
  },
  {
    title: 'Test config H: minimum application stake (100), no role stake, 10 applicant limit',
    start: new ActivateOpeningAt(CurrentBlock),
    policy: {
      max_review_period_length: new u32(99999),
      application_rationing_policy: createRationingPolicyOpt(10),
      application_staking_policy: createStakingPolicyOpt(100, STAKING_MODE_AT_LEAST)
    },
    text: newHRT('Test configuration H')
  },
  {
    title: 'Test config I: no application stake, minimum role stake (100), no applicant limit',
    start: new ActivateOpeningAt(CurrentBlock),
    policy: {
      max_review_period_length: new u32(99999),
      role_staking_policy: createStakingPolicyOpt(100, STAKING_MODE_AT_LEAST)
    },
    text: newHRT('Test configuration I')
  },
  {
    title: 'Test config J: no application stake, minimum role stake (100), 10 applicant limit',
    start: new ActivateOpeningAt(CurrentBlock),
    policy: {
      max_review_period_length: new u32(99999),
      application_rationing_policy: createRationingPolicyOpt(10),
      role_staking_policy: createStakingPolicyOpt(100, STAKING_MODE_AT_LEAST)
    },
    text: newHRT('Test configuration J')
  },
  {
    title: 'Test config K: fixed application stake (100), fixed role stake (200), no applicant limit',
    start: new ActivateOpeningAt(CurrentBlock),
    policy: {
      max_review_period_length: new u32(99999),
      application_staking_policy: createStakingPolicyOpt(100, STAKING_MODE_EXACT),
      role_staking_policy: createStakingPolicyOpt(200, STAKING_MODE_EXACT)
    },
    text: newHRT('Test configuration K')
  },
  {
    title: 'Test config L: fixed application stake (100), fixed role stake (200), 10 applicant limit',
    start: new ActivateOpeningAt(CurrentBlock),
    policy: {
      max_review_period_length: new u32(99999),
      application_rationing_policy: createRationingPolicyOpt(10),
      application_staking_policy: createStakingPolicyOpt(100, STAKING_MODE_EXACT),
      role_staking_policy: createStakingPolicyOpt(200, STAKING_MODE_EXACT)
    },
    text: newHRT('Test configuration L')
  },
  {
    title: 'Test config M: Minimum application stake (100), minimum role stake (200), no applicant limit',
    start: new ActivateOpeningAt(CurrentBlock),
    policy: {
      max_review_period_length: new u32(99999),
      application_staking_policy: createStakingPolicyOpt(100, STAKING_MODE_AT_LEAST),
      role_staking_policy: createStakingPolicyOpt(200, STAKING_MODE_AT_LEAST)
    },
    text: newHRT('Test configuration M')
  },
  {
    title: 'Test config N: Minimum application stake (100), minimum role stake (200), 10 applicant limit',
    start: new ActivateOpeningAt(CurrentBlock),
    policy: {
      max_review_period_length: new u32(99999),
      application_rationing_policy: createRationingPolicyOpt(10),
      application_staking_policy: createStakingPolicyOpt(100, STAKING_MODE_AT_LEAST),
      role_staking_policy: createStakingPolicyOpt(200, STAKING_MODE_AT_LEAST)
    },
    text: newHRT('Test configuration N')
  },
  {
    title: 'Test config O: Fixed application stake (100), minimum role stake (200), no applicant limit',
    start: new ActivateOpeningAt(CurrentBlock),
    policy: {
      max_review_period_length: new u32(99999),
      application_staking_policy: createStakingPolicyOpt(100, STAKING_MODE_EXACT),
      role_staking_policy: createStakingPolicyOpt(200, STAKING_MODE_AT_LEAST)
    },
    text: newHRT('Test configuration O')
  },
  {
    title: 'Test config P: Fixed application stake (100), minimum role stake (200), 10 applicant limit',
    start: new ActivateOpeningAt(CurrentBlock),
    policy: {
      max_review_period_length: new u32(99999),
      application_rationing_policy: new Option<ApplicationRationingPolicy>(
        ApplicationRationingPolicy,
        new ApplicationRationingPolicy({
          max_active_applicants: new u32(10)
        })
      ),
      application_staking_policy: createStakingPolicyOpt(100, STAKING_MODE_EXACT),
      role_staking_policy: createStakingPolicyOpt(200, STAKING_MODE_AT_LEAST)
    },
    text: newHRT('Test configuration P')
  },
  {
    title: 'Test config Q: Minimum application stake (100), fixed role stake (200), no applicant limit',
    start: new ActivateOpeningAt(CurrentBlock),
    policy: {
      max_review_period_length: new u32(99999),
      application_staking_policy: createStakingPolicyOpt(100, STAKING_MODE_AT_LEAST),
      role_staking_policy: createStakingPolicyOpt(200, STAKING_MODE_EXACT)
    },
    text: newHRT('Test configuration Q')
  },
  {
    title: 'Test config R: Minimum application stake (100), fixed role stake (200), 10 applicant limit',
    start: new ActivateOpeningAt(CurrentBlock),
    policy: {
      max_review_period_length: new u32(99999),
      application_rationing_policy: createRationingPolicyOpt(10),
      application_staking_policy: createStakingPolicyOpt(100, STAKING_MODE_AT_LEAST),
      role_staking_policy: createStakingPolicyOpt(200, STAKING_MODE_EXACT)
    },
    text: newHRT('Test configuration R')
  }
];

const newEmptyState = (): State => {
  return {
    openings: new Map<number, opening>(),
    currentDescriptor: stockOpenings[0],
    modalOpen: false
  };
};

export class AdminController extends Controller<State, ITransport> {
  api: ApiPromise;
  queueExtrinsic: QueueTxExtrinsicAdd;

  constructor (transport: ITransport, api: ApiPromise, queueExtrinsic: QueueTxExtrinsicAdd, initialState: State = newEmptyState()) {
    super(transport, initialState);
    this.api = api;
    this.queueExtrinsic = queueExtrinsic;
    this.state.currentDescriptor = stockOpenings[0];
    this.updateState();
  }

  onTxSuccess = () => { this.updateState(); }

  newOpening (accountId: string, desc: openingDescriptor) {
    const tx = this.api.tx.contentWorkingGroup.addCuratorOpening(
      desc.start,
      desc.policy,
      desc.text
    ) as unknown as SubmittableExtrinsic;

    // FIXME: Normally we would keep it open in case of errror, but due to bad design
    // the values in the form are reset at this point anyway, so there is no point
    this.closeModal();
    this.queueExtrinsic({ extrinsic: tx, txSuccessCb: this.onTxSuccess, accountId });
  }

  startAcceptingApplications (accountId: string, id = 0) {
    const tx = this.api.tx.contentWorkingGroup.acceptCuratorApplications(id);
    this.queueExtrinsic({ extrinsic: tx, txSuccessCb: this.onTxSuccess, accountId });
  }

  async applyAsACurator (creatorAddress: string, openingId: number) {
    const membershipIds = (await this.api.query.members.memberIdsByControllerAccountId(creatorAddress)) as Vec<MemberId>;
    if (membershipIds.length === 0) {
      console.error('No membship ID associated with this address');
      return;
    }
    const tx = this.api.tx.contentWorkingGroup.applyOnCuratorOpening(
      membershipIds[0],
      openingId,
      new GenericAccountId(creatorAddress),
      new Option(u128, 400),
      new Option(u128, 400),
      new Text('This is my application')
    ) as unknown as SubmittableExtrinsic;
    this.queueExtrinsic({ extrinsic: tx, txSuccessCb: this.onTxSuccess, accountId: creatorAddress });
  }

  beginApplicantReview (accountId: string, openingId: number) {
    const tx = this.api.tx.contentWorkingGroup.beginCuratorApplicantReview(openingId);
    this.queueExtrinsic({ extrinsic: tx, txSuccessCb: this.onTxSuccess, accountId });
  }

  acceptCuratorApplications (accountId: string, openingId: number, applications: Array<number>) {
    const tx = this.api.tx.contentWorkingGroup.fillCuratorOpening(
      openingId,
      applications,
      null
    ) as unknown as SubmittableExtrinsic;
    this.queueExtrinsic({ extrinsic: tx, txSuccessCb: this.onTxSuccess, accountId });
  }

  protected async profile (id: MemberId): Promise<Membership> {
    const member = (await this.api.query.members.membershipById(id)) as Membership;
    if (member.handle.isEmpty) {
      throw new Error(`Expected member profile not found! (id: ${id.toString()}`);
    }
    return member;
  }

  protected async stakeValue (stakeId: StakeId): Promise<Balance> {
    const stake = new SingleLinkedMapEntry<Stake>(
      Stake,
      await this.api.query.stake.stakes(
        stakeId
      )
    );
    return stake.value.value;
  }

  protected async roleStake (application: Application): Promise<Balance> {
    if (application.active_role_staking_id.isNone) {
      return Zero;
    }

    return this.stakeValue(application.active_role_staking_id.unwrap());
  }

  protected async applicationStake (application: Application): Promise<Balance> {
    if (application.active_application_staking_id.isNone) {
      return Zero;
    }

    return this.stakeValue(application.active_application_staking_id.unwrap());
  }

  async updateState () {
    this.state.openings = new Map<number, opening>();

    const nextOpeningId = await this.api.query.contentWorkingGroup.nextCuratorOpeningId() as CuratorOpeningId;
    for (let i = nextOpeningId.toNumber() - 1; i >= 0; i--) {
      const curatorOpening = new SingleLinkedMapEntry<CuratorOpening>(
        CuratorOpening,
        await this.api.query.contentWorkingGroup.curatorOpeningById(i)
      );

      const openingId = curatorOpening.value.opening_id;

      const baseOpening = new SingleLinkedMapEntry<Opening>(
        Opening,
        await this.api.query.hiring.openingById(
          openingId
        )
      );

      const hrt = baseOpening.value.parse_human_readable_text_with_fallback();
      const title = hrt.job.title;

      this.state.openings.set(i, {
        openingId: openingId.toNumber(),
        curatorId: i,
        applications: new Array<application>(),
        state: baseOpening.value.stage,
        title: title,
        classification: await classifyOpeningStage(this.transport, baseOpening.value)
      });
    }

    const nextAppid = await this.api.query.contentWorkingGroup.nextCuratorApplicationId() as CuratorApplicationId;
    for (let i = 0; i < nextAppid.toNumber(); i++) {
      const cApplication = new SingleLinkedMapEntry<CuratorApplication>(
        CuratorApplication,
        await this.api.query.contentWorkingGroup.curatorApplicationById(i)
      );

      const appId = cApplication.value.application_id;
      const baseApplications = new SingleLinkedMapEntry<Application>(
        Application,
        await this.api.query.hiring.applicationById(
          appId
        )
      );

      const curatorOpening = this.state.openings.get(
        cApplication.value.curator_opening_id.toNumber()
      ) as opening;

      curatorOpening.applications.push({
        openingId: appId.toNumber(),
        curatorId: i,
        stage: baseApplications.value.stage,
        account: cApplication.value.role_account_id.toString(),
        memberId: cApplication.value.member_id.toNumber(),
        profile: (await this.profile(cApplication.value.member_id)),
        applicationStake: await this.applicationStake(baseApplications.value),
        roleStake: await this.roleStake(baseApplications.value),
        application: baseApplications.value
      });
    }

    this.dispatch();
  }

  showNewOpeningModal (desc: openingDescriptor) {
    this.state.modalOpen = true;
    this.state.currentDescriptor = desc;
    this.dispatch();
  }

  closeModal () {
    this.state.modalOpen = false;
    this.dispatch();
  }
}

type AdminContainerProps = {
  state: State;
  controller: AdminController;
}
const AdminContainer = ({ state, controller }: AdminContainerProps) => {
  const address = useMyAccount().state.address;
  const containerRef = useRef<HTMLDivElement>(null);
  return (
    <div ref={containerRef}>
      <Container className="admin">
        <Card fluid color='orange'>
          <Card.Content>
            <Dropdown text='Create new opening...'>
              <Dropdown.Menu>
                {
                  stockOpenings.map((value, key) => {
                    return (
                      <Dropdown.Item
                        key={value.title}
                        text={value.title}
                        onClick={() => controller.showNewOpeningModal(value)}
                      />
                    );
                  })
                }
              </Dropdown.Menu>
            </Dropdown>
            <Modal
              open={state.modalOpen}
              onClose={() => controller.closeModal()}
              mountNode={containerRef.current} // Prevent conflicts with tx-modal (after form values reset issue is fixed, see FIXME: above)
            >
              <Modal.Content image>
                <Modal.Description>
                  <NewOpening desc={state.currentDescriptor} fn={(desc) => address && controller.newOpening(address, desc)} />
                </Modal.Description>
              </Modal.Content>
            </Modal>
          </Card.Content>
        </Card>
        {
          [...state.openings.keys()].map(key => <OpeningView key={key} opening={state.openings.get(key) as opening} controller={controller} />)
        }
        <br />
      </Container>
    </div>
  );
};

export const AdminView = View<AdminController, State>(
  (state, controller) => {
    return (
      <AdminContainer state={state} controller={controller} />
    );
  }
);

type NewOpeningProps = {
  desc: openingDescriptor;
  fn: (desc: openingDescriptor) => void;
}

const NewOpening = (props: NewOpeningProps) => {
  const [start, setStart] = useState(props.desc.start);
  const openingAtOptions = [
    {
      key: 'CurrentBlock',
      text: 'Current Block',
      value: 'CurrentBlock'
    },
    {
      key: 'ExactBlock',
      text: 'Exact Block',
      value: 'ExactBlock'
    }
  ];

  const [exactBlock, setExactBlock] = useState(0);
  const [showExactBlock, setShowExactBlock] = useState(false);

  const onChangeActivateAt = (e: any, { value }: any) => {
    switch (value) {
      case 'CurrentBlock':
        setShowExactBlock(false);
        setStart(new ActivateOpeningAt(CurrentBlock));
        break;

      case 'ExactBlock':
        setStart(new ActivateOpeningAt({ ExactBlock: exactBlock }));
        setShowExactBlock(true);
        break;
    }
  };

  const onChangeExactBlock = (e: any, { value }: any) => {
    setExactBlock(value);
    setStart(new ActivateOpeningAt({ ExactBlock: value }));
  };

  const [policy, setPolicy] = useState(props.desc.policy);

  const onChangePolicyField = <PolicyKey extends keyof policyDescriptor>(fieldName: PolicyKey, value: policyDescriptor[PolicyKey]) => {
    const newState = { ...policy };
    newState[fieldName] = value;
    setPolicy(newState);
  };

  const [requireAppStakingPolicy, setRequireAppStakingPolicy] = useState(
    !!(props.desc.policy &&
      props.desc.policy.application_staking_policy &&
      props.desc.policy.application_staking_policy.isSome)
  );

  const [requireRoleStakingPolicy, setRequireRoleStakingPolicy] = useState(
    !!(props.desc.policy &&
      props.desc.policy.role_staking_policy &&
      props.desc.policy.role_staking_policy.isSome)
  );

  const stakeLimitOptions = [
    {
      key: StakingAmountLimitModeKeys.AtLeast,
      text: StakingAmountLimitModeKeys.AtLeast,
      value: StakingAmountLimitModeKeys.AtLeast
    },
    {
      key: StakingAmountLimitModeKeys.Exact,
      text: StakingAmountLimitModeKeys.Exact,
      value: StakingAmountLimitModeKeys.Exact
    }
  ];

  const changeStakingMode = (
    fieldName: stakingFieldName,
    mode: StakingAmountLimitModeKeys | '',
    stakeValue: number
  ) => {
    if (mode === '') {
      const policyField = policy[fieldName];
      mode = policyField && policyField.isSome
        ? (policyField.unwrap().amount_mode.type as StakingAmountLimitModeKeys)
        : StakingAmountLimitModeKeys.Exact; // Default
    }
    const value = createStakingPolicyOpt(
      stakeValue,
      mode === StakingAmountLimitModeKeys.Exact ? STAKING_MODE_EXACT : STAKING_MODE_AT_LEAST
    );
    onChangePolicyField(fieldName, value);
  };

  const onStakeModeCheckboxChange = (fn: (v: boolean) => void, fieldName: stakingFieldName, checked: boolean, stakeValue: number) => {
    fn(checked);

    if (checked) {
      changeStakingMode(fieldName, StakingAmountLimitModeKeys.AtLeast, stakeValue);
    } else {
      onChangePolicyField(fieldName, undefined);
    }
  };

  const [text, setText] = useState(JSON.stringify(JSON.parse(props.desc.text.toString()), null, 2));

  const submit = () => {
    props.fn({
      start: start,
      policy: policy,
      text: new Text(text),
      title: ''
    });
  };

  return (
    <Form>
      <Form.Field>
        <label>Activate opening at</label>
        <Form.Dropdown
          selection
          onChange={onChangeActivateAt}
          options={openingAtOptions}
          value={start.type}
        />
        {showExactBlock === true &&
          <Input
            type="number"
            value={exactBlock}
            onChange={onChangeExactBlock}
          />
        }
      </Form.Field>

      <Form.Field>
        <label>Max review period length (in blocks)</label>
        <Input
          type="number"
          value={policy.max_review_period_length.toNumber()}
          onChange={(e: any, { value }: any) => onChangePolicyField('max_review_period_length', new u32(value))}
        />
      </Form.Field>

      <Form.Field>
        <label>Application staking policy</label>
        <Checkbox label="Require an application stake" checked={requireAppStakingPolicy} onChange={(e, { checked }: any) => onStakeModeCheckboxChange(setRequireAppStakingPolicy, 'application_staking_policy', checked, 0)} />
        {requireAppStakingPolicy && (
          <Message>
            <label>Stake mode</label>
            <Form.Dropdown
              selection
              onChange={(e, { value }: any) => changeStakingMode('application_staking_policy', value, 0)}
              options={stakeLimitOptions}
              value={policy.application_staking_policy?.unwrap().amount_mode.type}
            />

            <label>Stake value</label>
            <Input
              type="number"
              value={policy.application_staking_policy?.unwrap().amount.toNumber()}
              onChange={(e: any, { value }: any) => changeStakingMode('application_staking_policy', '', value)}
            />
          </Message>
        )}
      </Form.Field>

      <Form.Field>
        <label>Role staking policy</label>
        <Checkbox label="Require a role stake" checked={requireRoleStakingPolicy} onChange={(e, { checked }: any) => onStakeModeCheckboxChange(setRequireRoleStakingPolicy, 'role_staking_policy', checked, 0)} />
        {requireRoleStakingPolicy && (
          <Message>
            <label>Stake mode</label>
            <Form.Dropdown
              selection
              onChange={(e, { value }: any) => changeStakingMode('role_staking_policy', value, 0)}
              options={stakeLimitOptions}
              value={policy.role_staking_policy?.unwrap().amount_mode.type}
            />

            <label>Stake value</label>
            <Input
              type="number"
              value={policy.role_staking_policy?.unwrap().amount.toNumber()}
              onChange={(e: any, { value }: any) => changeStakingMode('role_staking_policy', '', value)}
            />
          </Message>
        )}
      </Form.Field>
      <Form.Field>
        <label>Role staking policy</label>
        <TextArea value={text} rows={10} onChange={(e: any, { value }: any) => setText(value)} />
      </Form.Field>

      <Form.Field align="right">
        <Button positive onClick={() => submit()}>Create opening</Button>
      </Form.Field>
    </Form>
  );
};

type OpeningViewProps = {
  controller: AdminController;
  opening: opening;
}

const OpeningView = (props: OpeningViewProps) => {
  const address = useMyAccount().state.address as string;
  const [applicationsOpen, setApplicationsOpen] = useState(true);
  const [selected, setSelected] = useState<number[]>([]);

  const toggleApplication = (id: number) => {
    if (selected.includes(id)) {
      setSelected(selected.filter(v => v !== id));
    } else {
      setSelected([...selected, id]);
    }
  };

  let CTAs = null;

  switch (props.opening.classification.state) {
    case OpeningState.InReview:
      CTAs = (
        <Container align="right">
          <Button onClick={() => { props.controller.acceptCuratorApplications(address, props.opening.curatorId, selected.sort()); }}>Accept curator applications</Button>
        </Container>
      );
  }

  return (
    <Card fluid>
      <Card.Content>
        <Card.Header>
          <Label attached="top right">Opening</Label>
          <Link to={'/working-groups/opportunities/curators/' + props.opening.curatorId}>
            {props.opening.title}
          </Link>

        </Card.Header>
        <Card.Meta>
          Working group module ID #{props.opening.curatorId}, hiring module ID #{props.opening.openingId}
        </Card.Meta>
        <Label ribbon>
          {openingDescription(props.opening.classification.state)}
        </Label>
      </Card.Content>
      <Card.Content extra>
        <Accordion>
          <Accordion.Title
            active={applicationsOpen}
            index={0}
            onClick={() => setApplicationsOpen(!applicationsOpen)}
          >
            <Icon name='dropdown' />
            Applications
          </Accordion.Title>
          <Accordion.Content active={applicationsOpen}>
            <Table striped>
              <Table.Header>
                <Table.Row>
                  <Table.HeaderCell>WG ID</Table.HeaderCell>
                  <Table.HeaderCell>Hiring ID</Table.HeaderCell>
                  <Table.HeaderCell>Member</Table.HeaderCell>
                  <Table.HeaderCell>Stage</Table.HeaderCell>
                  <Table.HeaderCell>App stake</Table.HeaderCell>
                  <Table.HeaderCell>Role stake</Table.HeaderCell>
                  <Table.HeaderCell>Total stake</Table.HeaderCell>
                  <Table.HeaderCell>Details</Table.HeaderCell>
                  <Table.HeaderCell></Table.HeaderCell>
                </Table.Row>
              </Table.Header>
              <Table.Body>
                {props.opening.applications.map((app, id) => (
                  <Table.Row key={app.openingId}>
                    <Table.Cell>{app.curatorId}</Table.Cell>
                    <Table.Cell>{app.openingId}</Table.Cell>
                    <Table.Cell>
                      <Link to={'/members/' + app.profile.handle}>
                        {app.profile.handle}
                      </Link>
                    </Table.Cell>
                    <Table.Cell>{app.stage.type}</Table.Cell>
                    <Table.Cell>{formatBalance(app.applicationStake)}</Table.Cell>
                    <Table.Cell>{formatBalance(app.roleStake)}</Table.Cell>
                    <Table.Cell>{formatBalance(Add(app.applicationStake, app.roleStake))}</Table.Cell>
                    <Table.Cell>
                      <Modal trigger={
                        <Button>view</Button>
                      }>
                        <Modal.Header>Application details</Modal.Header>
                        <Modal.Content>
                          <h3>Raw JSON</h3>
                          <Message info>
                            {JSON.stringify(app.application.toJSON())}
                          </Message>

                          <h3>Application form</h3>
                          <Message info>
                            {app.application.human_readable_text.toString()}
                          </Message>
                        </Modal.Content>
                      </Modal>
                    </Table.Cell>
                    <Table.Cell>
                      <Checkbox onChange={() => toggleApplication(app.curatorId)} checked={selected.includes(app.curatorId)} />
                    </Table.Cell>
                  </Table.Row>
                ))}
              </Table.Body>
            </Table>
            {CTAs}
          </Accordion.Content>
        </Accordion>
      </Card.Content>
      <Card.Content extra>
        <Grid>
          <Grid.Row columns={2}>
            <Grid.Column>
              <Dropdown text='Set stage'>
                <Dropdown.Menu>
                  <Dropdown.Item
                    text='Start accepting applications'
                    onClick={() => { props.controller.startAcceptingApplications(address, props.opening.curatorId); }}
                  />
                  <Dropdown.Item
                    text='Begin applicant review'
                    onClick={() => { props.controller.beginApplicantReview(address, props.opening.curatorId); }}
                  />
                </Dropdown.Menu>
              </Dropdown>
            </Grid.Column>
            <Grid.Column align="right">
            </Grid.Column>
          </Grid.Row>
        </Grid>
      </Card.Content>
    </Card>
  );
};
