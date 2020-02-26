// @ts-nocheck
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { formatBalance } from '@polkadot/util';

import { ApiPromise } from '@polkadot/api';
import { Balance } from '@polkadot/types/interfaces'
import { GenericAccountId, Option, u32, u64, u128, Set, Text, Vec } from '@polkadot/types'

import { SingleLinkedMapEntry } from '@polkadot/joy-utils/index'
import { MyAccountProvider, useMyAccount } from '@polkadot/joy-utils/MyAccountContext'

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
  TextArea,
} from 'semantic-ui-react'
import { Controller, View } from '@polkadot/joy-utils/index'
import { ITransport } from '../transport'

import {
  Application,
  ApplicationStage,
  ActivateOpeningAt,
  ApplicationRationingPolicy,
  CurrentBlock, ExactBlock,
  Opening,
  OpeningStage,
  StakingPolicy,
  StakingAmountLimitModeKeys,
} from '@joystream/types/hiring'

import {
  Profile,
  MemberId,
} from '@joystream/types/members'

import { Stake, StakeId } from '@joystream/types/stake'

import {
  GenericJoyStreamRoleSchema,
} from '@joystream/types/hiring/schemas/role.schema.typings'
import {
  CuratorApplication, CuratorApplicationId,
  CuratorOpening,
  OpeningPolicyCommitment, IOpeningPolicyCommitment,
} from '@joystream/types/content-working-group'

import {
  classifyOpeningStage,
  OpeningStageClassification,
  OpeningState,
} from '../classifiers'

import {
  openingDescription,
} from '../openingStateMarkup'

import { Add, Sort, Sum, Zero } from '../balances'

type ids = {
  curatorId: number
  openingId: number
}

type application = ids & {
  account: string,
  memberId: number,
  profile: Profile,
  stage: ApplicationStage,
  applicationStake: Balance,
  roleStake: Balance,
  application: Application,
}

type opening = ids & {
  title: string,
  state: OpeningStage,
  applications: Array<application>,
  classification: OpeningStageClassification,
}

type State = {
  openings: Map<number, opening>,
  currentDescriptor: openingDescriptor,
  modalOpen: boolean,
}

const newEmptyState = (): State => {
  return {
    openings: new Map<number, opening>(),
    openingDescriptor: stockOpenings[0],
    modalOpen: false,
  }
}

// TODO: Make a list of stock openings
type openingDescriptor = {
  title: string,
  start: ActivateOpeningAt,
  policy: IOpeningPolicyCommitment,
  text: Text,
}

function newHRT(title: string): Text {
  return new Text(JSON.stringify({
    version: 1,
    headline: "some headline",
    job: {
      title: title,
      description: "some job description",
    },
    application: {
      sections: [
        {
          title: "About you",
          questions: [
            {
              title: "your name",
              type: "text"
            }
          ]
        },
        {
          title: "Something else",
          questions: [
            {
              title: "another thing",
              type: "text area"
            }
          ]
        }
      ]
    },
    reward: "10 JOY per block",
    creator: {
      membership: {
        handle: "ben",
      }
    },
    process: {
      details: [
        "Some custom detail"
      ]
    }
  })
  )
}

const stockOpenings: openingDescriptor[] = [
  {
    title: "Test config A: no application stake, no role stake, no applicant limit",
    start: new ActivateOpeningAt(CurrentBlock),
    policy: {
      max_review_period_length: new u32(99999),
    },
    text: newHRT("Test configuration A"),
  },
  {
    title: "Test config B: no application stake, no role stake, 10 applicant limit",
    start: new ActivateOpeningAt(CurrentBlock),
    policy: {
      max_review_period_length: new u32(99999),
    },
    text: newHRT("Test configuration B"),
  },
  {
    title: "Test config C: fixed application stake (100), no role stake, no applicant limit",
    start: new ActivateOpeningAt(CurrentBlock),
    policy: {
      max_review_period_length: new u32(99999),
      application_staking_policy: new Option<StakingPolicy>(
        StakingPolicy,
        new StakingPolicy({
          amount: new u128(100),
          amount_mode: StakingAmountLimitModeKeys.Exact,
        }),
      ),
    },
    text: newHRT("Test configuration C"),
  },
  {
    title: "Test config D: fixed application stake (100), no role stake, 10 applicant limit",
    start: new ActivateOpeningAt(CurrentBlock),
    policy: {
      max_review_period_length: new u32(99999),
      application_rationing_policy: new Option<ApplicationRationingPolicy>(
        ApplicationRationingPolicy,
        new ApplicationRationingPolicy({
          max_active_applicants: new u32(10),
        }),
      ),
      application_staking_policy: new Option<StakingPolicy>(
        StakingPolicy,
        new StakingPolicy({
          amount: new u128(100),
          amount_mode: StakingAmountLimitModeKeys.Exact,
        }),
      ),
    },
    text: newHRT("Test configuration D"),
  },
  {
    title: "Test config E: no application stake, fixed role stake (100), no applicant limit",
    start: new ActivateOpeningAt(CurrentBlock),
    policy: {
      max_review_period_length: new u32(99999),
      role_staking_policy: new Option<StakingPolicy>(
        StakingPolicy,
        new StakingPolicy({
          amount: new u128(100),
          amount_mode: StakingAmountLimitModeKeys.Exact,
        }),
      ),
    },
    text: newHRT("Test configuration E"),
  },
  {
    title: "Test config F: no application stake, fixed role stake (100), 10 applicant limit",
    start: new ActivateOpeningAt(CurrentBlock),
    policy: {
      max_review_period_length: new u32(99999),
      application_rationing_policy: new Option<ApplicationRationingPolicy>(
        ApplicationRationingPolicy,
        new ApplicationRationingPolicy({
          max_active_applicants: new u32(10),
        }),
      ),
      role_staking_policy: new Option<StakingPolicy>(
        StakingPolicy,
        new StakingPolicy({
          amount: new u128(100),
          amount_mode: StakingAmountLimitModeKeys.Exact,
        }),
      ),
    },
    text: newHRT("Test configuration F"),
  },
  {
    title: "Test config G: minimum application stake (100), no role stake, no applicant limit",
    start: new ActivateOpeningAt(CurrentBlock),
    policy: {
      max_review_period_length: new u32(99999),
      application_staking_policy: new Option<StakingPolicy>(
        StakingPolicy,
        new StakingPolicy({
          amount: new u128(100),
          amount_mode: StakingAmountLimitModeKeys.AtLeast,
        }),
      ),
    },
    text: newHRT("Test configuration G"),
  },
  {
    title: "Test config H: minimum application stake (100), no role stake, 10 applicant limit",
    start: new ActivateOpeningAt(CurrentBlock),
    policy: {
      max_review_period_length: new u32(99999),
      application_rationing_policy: new Option<ApplicationRationingPolicy>(
        ApplicationRationingPolicy,
        new ApplicationRationingPolicy({
          max_active_applicants: new u32(10),
        }),
      ),
      application_staking_policy: new Option<StakingPolicy>(
        StakingPolicy,
        new StakingPolicy({
          amount: new u128(100),
          amount_mode: StakingAmountLimitModeKeys.AtLeast,
        }),
      ),
    },
    text: newHRT("Test configuration H"),
  },
  {
    title: "Test config I: no application stake, minimum role stake (100), no applicant limit",
    start: new ActivateOpeningAt(CurrentBlock),
    policy: {
      max_review_period_length: new u32(99999),
      role_staking_policy: new Option<StakingPolicy>(
        StakingPolicy,
        new StakingPolicy({
          amount: new u128(100),
          amount_mode: StakingAmountLimitModeKeys.AtLeast,
        }),
      ),
    },
    text: newHRT("Test configuration I"),
  },
  {
    title: "Test config J: no application stake, minimum role stake (100), 10 applicant limit",
    start: new ActivateOpeningAt(CurrentBlock),
    policy: {
      max_review_period_length: new u32(99999),
      application_rationing_policy: new Option<ApplicationRationingPolicy>(
        ApplicationRationingPolicy,
        new ApplicationRationingPolicy({
          max_active_applicants: new u32(10),
        }),
      ),
      role_staking_policy: new Option<StakingPolicy>(
        StakingPolicy,
        new StakingPolicy({
          amount: new u128(100),
          amount_mode: StakingAmountLimitModeKeys.AtLeast,
        }),
      ),
    },
    text: newHRT("Test configuration J"),
  },
  {
    title: "Test config K: fixed application stake (100), fixed role stake (200), no applicant limit",
    start: new ActivateOpeningAt(CurrentBlock),
    policy: {
      max_review_period_length: new u32(99999),
      application_staking_policy: new Option<StakingPolicy>(
        StakingPolicy,
        new StakingPolicy({
          amount: new u128(100),
          amount_mode: StakingAmountLimitModeKeys.Exact,
        }),
      ),
      role_staking_policy: new Option<StakingPolicy>(
        StakingPolicy,
        new StakingPolicy({
          amount: new u128(200),
          amount_mode: StakingAmountLimitModeKeys.Exact,
        }),
      ),
    },
    text: newHRT("Test configuration K"),
  },
  {
    title: "Test config L: fixed application stake (100), fixed role stake (200), 10 applicant limit",
    start: new ActivateOpeningAt(CurrentBlock),
    policy: {
      max_review_period_length: new u32(99999),
      application_rationing_policy: new Option<ApplicationRationingPolicy>(
        ApplicationRationingPolicy,
        new ApplicationRationingPolicy({
          max_active_applicants: new u32(10),
        }),
      ),
      application_staking_policy: new Option<StakingPolicy>(
        StakingPolicy,
        new StakingPolicy({
          amount: new u128(100),
          amount_mode: StakingAmountLimitModeKeys.Exact,
        }),
      ),
      role_staking_policy: new Option<StakingPolicy>(
        StakingPolicy,
        new StakingPolicy({
          amount: new u128(200),
          amount_mode: StakingAmountLimitModeKeys.Exact,
        }),
      ),
    },
    text: newHRT("Test configuration L"),
  },
  {
    title: "Test config M: Minimum application stake (100), minimum role stake (200), no applicant limit",
    start: new ActivateOpeningAt(CurrentBlock),
    policy: {
      max_review_period_length: new u32(99999),
      application_staking_policy: new Option<StakingPolicy>(
        StakingPolicy,
        new StakingPolicy({
          amount: new u128(100),
          amount_mode: StakingAmountLimitModeKeys.AtLeast,
        }),
      ),
      role_staking_policy: new Option<StakingPolicy>(
        StakingPolicy,
        new StakingPolicy({
          amount: new u128(200),
          amount_mode: StakingAmountLimitModeKeys.AtLeast,
        }),
      ),
    },
    text: newHRT("Test configuration M"),
  },
  {
    title: "Test config N: Minimum application stake (100), minimum role stake (200), 10 applicant limit",
    start: new ActivateOpeningAt(CurrentBlock),
    policy: {
      max_review_period_length: new u32(99999),
      application_rationing_policy: new Option<ApplicationRationingPolicy>(
        ApplicationRationingPolicy,
        new ApplicationRationingPolicy({
          max_active_applicants: new u32(10),
        }),
      ),
      application_staking_policy: new Option<StakingPolicy>(
        StakingPolicy,
        new StakingPolicy({
          amount: new u128(100),
          amount_mode: StakingAmountLimitModeKeys.AtLeast,
        }),
      ),
      role_staking_policy: new Option<StakingPolicy>(
        StakingPolicy,
        new StakingPolicy({
          amount: new u128(200),
          amount_mode: StakingAmountLimitModeKeys.AtLeast,
        }),
      ),
    },
    text: newHRT("Test configuration N"),
  },
  {
    title: "Test config O: Fixed application stake (100), minimum role stake (200), no applicant limit",
    start: new ActivateOpeningAt(CurrentBlock),
    policy: {
      max_review_period_length: new u32(99999),
      application_staking_policy: new Option<StakingPolicy>(
        StakingPolicy,
        new StakingPolicy({
          amount: new u128(100),
          amount_mode: StakingAmountLimitModeKeys.Exact,
        }),
      ),
      role_staking_policy: new Option<StakingPolicy>(
        StakingPolicy,
        new StakingPolicy({
          amount: new u128(200),
          amount_mode: StakingAmountLimitModeKeys.AtLeast,
        }),
      ),
    },
    text: newHRT("Test configuration O"),
  },
  {
    title: "Test config P: Fixed application stake (100), minimum role stake (200), 10 applicant limit",
    start: new ActivateOpeningAt(CurrentBlock),
    policy: {
      max_review_period_length: new u32(99999),
      application_rationing_policy: new Option<ApplicationRationingPolicy>(
        ApplicationRationingPolicy,
        new ApplicationRationingPolicy({
          max_active_applicants: new u32(10),
        }),
      ),
      application_staking_policy: new Option<StakingPolicy>(
        StakingPolicy,
        new StakingPolicy({
          amount: new u128(100),
          amount_mode: StakingAmountLimitModeKeys.Exact,
        }),
      ),
      role_staking_policy: new Option<StakingPolicy>(
        StakingPolicy,
        new StakingPolicy({
          amount: new u128(200),
          amount_mode: StakingAmountLimitModeKeys.AtLeast,
        }),
      ),
    },
    text: newHRT("Test configuration P"),
  },
  {
    title: "Test config Q: Minimum application stake (100), fixed role stake (200), no applicant limit",
    start: new ActivateOpeningAt(CurrentBlock),
    policy: {
      max_review_period_length: new u32(99999),
      application_staking_policy: new Option<StakingPolicy>(
        StakingPolicy,
        new StakingPolicy({
          amount: new u128(100),
          amount_mode: StakingAmountLimitModeKeys.AtLeast,
        }),
      ),
      role_staking_policy: new Option<StakingPolicy>(
        StakingPolicy,
        new StakingPolicy({
          amount: new u128(200),
          amount_mode: StakingAmountLimitModeKeys.Exact,
        }),
      ),
    },
    text: newHRT("Test configuration Q"),
  },
  {
    title: "Test config R: Minimum application stake (100), fixed role stake (200), 10 applicant limit",
    start: new ActivateOpeningAt(CurrentBlock),
    policy: {
      max_review_period_length: new u32(99999),
      application_rationing_policy: new Option<ApplicationRationingPolicy>(
        ApplicationRationingPolicy,
        new ApplicationRationingPolicy({
          max_active_applicants: new u32(10),
        }),
      ),
      application_staking_policy: new Option<StakingPolicy>(
        StakingPolicy,
        new StakingPolicy({
          amount: new u128(100),
          amount_mode: StakingAmountLimitModeKeys.AtLeast,
        }),
      ),
      role_staking_policy: new Option<StakingPolicy>(
        StakingPolicy,
        new StakingPolicy({
          amount: new u128(200),
          amount_mode: StakingAmountLimitModeKeys.Exact,
        }),
      ),
    },
    text: newHRT("Test configuration R"),
  },
]

export class AdminController extends Controller<State, ITransport> {
  api: ApiPromise
  constructor(transport: ITransport, api: ApiPromise, initialState: State = newEmptyState()) {
    super(transport, initialState)
    this.api = api
    this.state.openingDescriptor = stockOpenings[0]
    this.updateState()
  }

  newOpening(creatorAddress: string, desc: openingDescriptor) {
    const tx = this.api.tx.contentWorkingGroup.addCuratorOpening(
      desc.start,
      new OpeningPolicyCommitment(desc.policy),
      desc.text,
    )

    tx.signAndSend(creatorAddress, ({ events = [], status }) => {
      if (status.isFinalized) {
        this.updateState()
        console.log('Successful transfer with hash ' + status.asFinalized.toHex());
      } else {
        console.log('Status of transfer: ' + status.type);
      }

      events.forEach(({ phase, event: { data, method, section } }) => {
        console.log(phase.toString() + ' : ' + section + '.' + method + ' ' + data.toString());
      });
    });
  }

  startAcceptingApplications(creatorAddress: string, id: number = 0) {
    const tx = this.api.tx.contentWorkingGroup.acceptCuratorApplications(new u32(id))
    tx.signAndSend(creatorAddress, ({ events = [], status }) => {
      if (status.isFinalized) {
        this.updateState()
        console.log('Successful transfer with hash ' + status.asFinalized.toHex());
      } else {
        console.log('Status of transfer: ' + status.type);
      }

      events.forEach(({ phase, event: { data, method, section } }) => {
        console.log(phase.toString() + ' : ' + section + '.' + method + ' ' + data.toString());
      });
    });
  }

  async applyAsACurator(creatorAddress: string, openingId: number) {
    const membershipIds = (await this.api.query.members.memberIdsByControllerAccountId(creatorAddress)) as Vec<MemberId>
    if (membershipIds.length == 0) {
      console.error("No membship ID associated with this address")
      return
    }
    const tx = this.api.tx.contentWorkingGroup.applyOnCuratorOpening(
      membershipIds[0],
      new u32(openingId),
      new GenericAccountId(creatorAddress),
      new Option(u128, 400),
      new Option(u128, 400),
      new Text("This is my application"),
    )
    tx.signAndSend(creatorAddress, ({ events = [], status }) => {
      if (status.isFinalized) {
        this.updateState()
        console.log('Successful transfer with hash ' + status.asFinalized.toHex());
      } else {
        console.log('Status of transfer: ' + status.type);
      }

      events.forEach(({ phase, event: { data, method, section } }) => {
        console.log(phase.toString() + ' : ' + section + '.' + method + ' ' + data.toString());
      });
    });
  }

  beginApplicantReview(creatorAddress: string, openingId: number) {
    const tx = this.api.tx.contentWorkingGroup.beginCuratorApplicantReview(
      new u32(openingId),
    )
    tx.signAndSend(creatorAddress, ({ events = [], status }) => {
      if (status.isFinalized) {
        this.updateState()
        console.log('Successful transfer with hash ' + status.asFinalized.toHex());
      } else {
        console.log('Status of transfer: ' + status.type);
      }

      events.forEach(({ phase, event: { data, method, section } }) => {
        console.log(phase.toString() + ' : ' + section + '.' + method + ' ' + data.toString());
      });
    });
  }

  acceptCuratorApplications(creatorAddress: string, openingId: number, applications: Array<number>) {
    const tx = this.api.tx.contentWorkingGroup.fillCuratorOpening(
      new u32(openingId),
      applications,
      null,
    )
    tx.signAndSend(creatorAddress, ({ events = [], status }) => {
      if (status.isFinalized) {
        this.updateState()
        console.log('Successful transfer with hash ' + status.asFinalized.toHex());
      } else {
        console.log('Status of transfer: ' + status.type);
      }

      events.forEach(({ phase, event: { data, method, section } }) => {
        console.log(phase.toString() + ' : ' + section + '.' + method + ' ' + data.toString());
      });
    });
  }

  protected async profile(id: MemberId): Promise<Profile> {
    return (await this.api.query.members.memberProfile(id)) as Profile
  }

  protected async stakeValue(stakeId: StakeId): Promise<Balance> {
    const stake = new SingleLinkedMapEntry<Stake>(
      Stake,
      await this.api.query.stake.stakes(
        stakeId,
      ),
    )
    return stake.value.value
  }

  protected async roleStake(application: Application): Promise<Balance> {
    if (application.active_role_staking_id.isNone) {
      return Zero
    }

    return this.stakeValue(application.active_role_staking_id.unwrap())
  }

  protected async applicationStake(application: Application): Promise<Balance> {
    if (application.active_application_staking_id.isNone) {
      return Zero
    }

    return this.stakeValue(application.active_application_staking_id.unwrap())
  }

  async updateState() {
    this.state.openings = new Map<number, opening>()

    const nextOpeningId = await this.api.query.contentWorkingGroup.nextCuratorOpeningId() as u64
    for (let i = nextOpeningId.toNumber() - 1; i >= 0; i--) {
      const curatorOpening = new SingleLinkedMapEntry<CuratorOpening>(
        CuratorOpening,
        await this.api.query.contentWorkingGroup.curatorOpeningById(i),
      )

      const openingId = curatorOpening.value.getField<u32>('opening_id')

      const baseOpening = new SingleLinkedMapEntry<Opening>(
        Opening,
        await this.api.query.hiring.openingById(
          openingId,
        )
      )

      let title: string = "unknown"
      const hrt = baseOpening.value.parse_human_readable_text()
      if (typeof hrt !== 'undefined') {
        title = (hrt as GenericJoyStreamRoleSchema).job.title
      }

      this.state.openings.set(openingId.toNumber(), {
        openingId: openingId.toNumber(),
        curatorId: i,
        applications: new Array<application>(),
        state: baseOpening.value.stage,
        title: title,
        classification: await classifyOpeningStage(this.transport, baseOpening.value),
      })
    }

    const nextAppid = await this.api.query.contentWorkingGroup.nextCuratorApplicationId() as u64
    for (let i = 0; i < nextAppid.toNumber(); i++) {
      const cApplication = new SingleLinkedMapEntry<CuratorApplication>(
        CuratorApplication,
        await this.api.query.contentWorkingGroup.curatorApplicationById(i),
      )

      const appId = cApplication.value.getField<u32>('application_id')
      const baseApplications = new SingleLinkedMapEntry<Application>(
        Application,
        await this.api.query.hiring.applicationById(
          appId,
        )
      )

      const curatorOpening = this.state.openings.get(
        cApplication.value.getField<u32>('curator_opening_id').toNumber(),
      ) as opening

      curatorOpening.applications.push({
        openingId: appId.toNumber(),
        curatorId: i,
        stage: baseApplications.value.getField<ApplicationStage>('stage'),
        account: cApplication.value.getField('role_account').toString(),
        memberId: cApplication.value.getField<u32>('member_id').toNumber(),
        profile: (await this.profile(cApplication.value.getField<u32>('member_id'))).unwrap(),
        applicationStake: await this.applicationStake(baseApplications.value),
        roleStake: await this.roleStake(baseApplications.value),
        application: baseApplications.value,
      })
    }

    this.dispatch()
  }

  showNewOpeningModal(desc: openingDescriptor) {
    this.state.modalOpen = true
    this.state.openingDescriptor = desc
    this.dispatch()
  }

  closeModal() {
    this.state.modalOpen = false
    this.dispatch()
  }
}

export const AdminView = View<AdminController, State>(
  (state, controller) => {
    const address = useMyAccount().state.address as string
    return (
      <MyAccountProvider>
        <Container className="admin">
          <Card fluid color='orange'>
            <Card.Content>
              <Dropdown text='Create new opening...'>
                <Dropdown.Menu>
                  {
                    stockOpenings.map((value, key) => {
                      return (
                        <Dropdown.Item
                          text={value.title}
                          onClick={() => controller.showNewOpeningModal(value)}
                        />
                      )
                    })
                  }
                </Dropdown.Menu>
              </Dropdown>
              <Modal open={state.modalOpen} onClose={() => controller.closeModal()}>
                <Modal.Content image>
                  <Modal.Description>
                    <NewOpening desc={state.openingDescriptor} fn={(desc) => controller.newOpening(address, desc)} />
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
      </MyAccountProvider>
    )
  }
)

type NewOpeningProps = {
  desc: openingDescriptor
  fn: (desc: openingDescriptor) => void
}

const NewOpening = (props: NewOpeningProps) => {
  const [start, setStart] = useState(props.desc.start)
  const openingAtOptions = [
    {
      key: "CurrentBlock",
      text: "Current Block",
      value: "CurrentBlock",
    },
    {
      key: "ExactBlock",
      text: "Exact Block",
      value: "ExactBlock",
    },
  ];

  const [exactBlock, setExactBlock] = useState(0)
  const [showExactBlock, setShowExactBlock] = useState(false)

  const onChangeActivateAt = (e: any, { value }: any) => {
    switch (value) {
      case "CurrentBlock":
        setShowExactBlock(false)
        setStart(new ActivateOpeningAt(CurrentBlock))
        break

      case "ExactBlock":
        setStart(new ActivateOpeningAt({ ExactBlock: exactBlock }))
        setShowExactBlock(true)
        break
    }
  }

  const onChangeExactBlock = (e: any, { value }: any) => {
    setExactBlock(value)
    setStart(new ActivateOpeningAt({ ExactBlock: value }))
  }

  const [policy, setPolicy] = useState(props.desc.policy)

  const onChangePolicyField = (fieldName, value) => {
    const newState = Object.assign({}, policy)
    newState[fieldName] = value
    setPolicy(newState)
  }

  const [requireAppStakingPolicy, setRequireAppStakingPolicy] = useState(
    props.desc.policy &&
      props.desc.policy.application_staking_policy &&
      props.desc.policy.application_staking_policy.isSome ?
      true : false
  )

  const [requireRoleStakingPolicy, setRequireRoleStakingPolicy] = useState(
    props.desc.policy &&
      props.desc.policy.role_staking_policy &&
      props.desc.policy.role_staking_policy.isSome ?
      true : false
  )

  const stakeLimitOptions = [
    {
      key: StakingAmountLimitModeKeys.AtLeast,
      text: StakingAmountLimitModeKeys.AtLeast,
      value: StakingAmountLimitModeKeys.AtLeast,
    },
    {
      key: StakingAmountLimitModeKeys.Exact,
      text: StakingAmountLimitModeKeys.Exact,
      value: StakingAmountLimitModeKeys.Exact,
    },
  ];

  const onStakeModeCheckboxChange = (fn: (v: boolean) => void, fieldName: string, checked: boolean, stakeValue: number) => {
    fn(checked)

    if (checked) {
      changeStakingMode(fieldName, StakingAmountLimitModeKeys.AtLeast, stakeValue)
    } else {
      onChangePolicyField(fieldName, null)
    }
  }

  const changeStakingMode = (fieldName: string, mode: string, stakeValue: number) => {
    const value = new Option<StakingPolic>(
      StakingPolicy,
      new StakingPolicy({
        amount: new u128(stakeValue),
        amount_mode: mode == '' && policy[fieldName].isSome ? policy[fieldName].type : mode,
      })
    )
    onChangePolicyField(fieldName, value)
  }

  const [text, setText] = useState(JSON.stringify(JSON.parse(props.desc.text.toString()), null, 2))

  const submit = () => {
    props.fn({
      start: start,
      policy: policy,
      text: new Text(text),
    })
  }

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
        {showExactBlock == true &&
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
              value={policy.application_staking_policy.unwrap().amount_mode.type}
            />

            <label>Stake value</label>
            <Input
              type="number"
              value={policy.application_staking_policy.unwrap().amount.toNumber()}
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
              value={policy.role_staking_policy.unwrap().amount_mode.type}
            />

            <label>Stake value</label>
            <Input
              type="number"
              value={policy.role_staking_policy.unwrap().amount.toNumber()}
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
  )
}

type OpeningViewProps = {
  controller: AdminController
  opening: opening
}

const OpeningView = (props: OpeningViewProps) => {
  const address = useMyAccount().state.address as string
  const [applicationsOpen, setApplicationsOpen] = useState(true)
  const [selected, setSelected] = useState<number[]>([])

  const toggleApplication = (id: number) => {
    if (selected.indexOf(id) >= 0) {
      setSelected(selected.filter(v => v != id))
    } else {
      setSelected([...selected, id])
    }
  }

  let CTAs = null

  switch (props.opening.classification.state) {
    case OpeningState.InReview:
      CTAs = (
        <Container align="right">
          <Button onClick={() => { props.controller.acceptCuratorApplications(address, props.opening.curatorId, selected.sort()) }}>Accept curator applications</Button>
        </Container>
      )
  }

  return (
    <Card fluid>
      <Card.Content>
        <Card.Header>
          <Label attached="top right">Opening</Label>
          <Link to={"/working-groups/opportunities/curators/" + props.opening.curatorId}>
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
                      <Link to={"/members/" + app.profile.handle}>
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
                      <Checkbox onChange={() => toggleApplication(app.curatorId)} checked={selected.indexOf(app.curatorId) > -1} />
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
                    onClick={() => { props.controller.startAcceptingApplications(address, props.opening.curatorId) }}
                  />
                  <Dropdown.Item
                    text='Begin applicant review'
                    onClick={() => { props.controller.beginApplicantReview(address, props.opening.curatorId) }}
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
  )
}
