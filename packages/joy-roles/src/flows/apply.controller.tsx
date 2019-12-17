import React from 'react';

import { u128, GenericAccountId } from '@polkadot/types'
import { formatBalance } from '@polkadot/util';
import { Balance } from '@polkadot/types/interfaces';
import AccountId from '@polkadot/types/primitive/Generic/AccountId';

import { Observable, View } from '@polkadot/joy-utils/index'

import { ITransport } from '../transport'

import {
  keyPairDetails,
  FlowModal
} from './apply'

import {
  GroupMember,
} from '../elements'

import {
  ApplicationStakeRequirement, RoleStakeRequirement,
  StakeType,
} from '../StakeRequirement'

import {
  OpeningStakeAndApplicationStatus,
} from '../tabs/Opportunities'

import {
  ApplicationDetails,
} from '@joystream/types/schemas/role.schema'

import { creator } from "../tabs/Opportunities.stories"

// FIXME! Make this type-safe
type State = {
  // Input data from state
  applications: OpeningStakeAndApplicationStatus
  creator: GroupMember
  transactionFee: Balance
  keypairs: keyPairDetails[]
  hasConfirmStep: boolean
  step: Balance // Rename: this is the +/- step for selecting stakes
  slots: Balance[] // Rename: this is the current application slots
  applicationDetails: ApplicationDetails

  // Data generated for transaction
  transactionDetails: Map<string, string>
  roleKeyName: string
}

export class ApplyController extends Observable<State, ITransport> {
  constructor(transport: ITransport, initialState: State = {}) {
    super(transport, initialState)

    const slots: Balance[] = []
    for (let i = 0; i < 20; i++) {
      slots.push(new u128((i * 100) + 10 + i + 1))
    }

    this.state = {
      applications: {
        numberOfApplications: 0,
        maxNumberOfApplications: 0,
        requiredApplicationStake: new ApplicationStakeRequirement(
          new u128(500),
          StakeType.AtLeast,
        ),
        requiredRoleStake: new RoleStakeRequirement(
          new u128(500),
          StakeType.Fixed,
        ),
        defactoMinimumStake: new u128(0),
      },
      creator: creator,
      transactionFee: new u128(500),
      keypairs: [
        {
          shortName: "KP1",
          accountId: new GenericAccountId('5HZ6GtaeyxagLynPryM7ZnmLzoWFePKuDrkb4AT8rT4pU1fp'),
          balance: new u128(23342),
        },
        {
          shortName: "KP2",
          accountId: new GenericAccountId('5DQqNWRFPruFs9YKheVMqxUbqoXeMzAWfVfcJgzuia7NA3D3'),
          balance: new u128(993342),
        },
        {
          shortName: "KP3",
          accountId: new GenericAccountId('5DBaczGTDhcHgwsZzNE5qW15GrQxxdyros4pYkcKrSUovFQ9'),
          balance: new u128(242),
        },
      ],
      hasConfirmStep: true,
      step: new u128(5),
      slots: slots,
      applicationDetails: {
        sections: [
          {
            title: "About you",
            questions: [
              {
                title: "Your name",
                type: "text"
              },
              {
                title: "Your e-mail address",
                type: "text"
              }
            ]
          },
          {
            title: "Your experience",
            questions: [
              {
                title: "Why would you be good for this role?",
                type: "text area"
              }
            ]
          }
        ]
      },
    }

    this.state.transactionDetails = new Map<string, string>()
    this.state.roleKeyName = ""
  }

  async prepareApplicationTransaction(
    applicationStake: Balance,
    roleStake: Balance,
    questionResponses: any,
    stakeKeyAddress: AccountId, stakeKeyPassphrase: string,
    txKeyAddress: AccountId, txKeyPassphrase: string,
  ): Promise<any> {
    return new Promise<any>((resolve, reject) => {
      console.log("Selected stake:", applicationStake, roleStake)
      console.log("Questions:", questionResponses)
      console.log("Stake key:", stakeKeyAddress, stakeKeyPassphrase)
      console.log("Tx key:", txKeyAddress, txKeyPassphrase)

      this.state.transactionDetails.set("Transaction fee", formatBalance(this.state.transactionFee))
      this.state.transactionDetails.set("Application stake", formatBalance(applicationStake))
      this.state.transactionDetails.set("Role stake", formatBalance(roleStake))
      this.state.transactionDetails.set("Extrinsic hash", "0xae6d24d4d55020c645ddfe2e8d0faf93b1c0c9879f9bf2c439fb6514c6d1292e")
      this.state.roleKeyName = "some-role.key"

      this.dispatch()
      resolve()
    })
  }

  // FIXME! All these arguments should be 'prepare transaction'
  async makeApplicationTransaction(): Promise<any> {
    return new Promise<any>((resolve, reject) => {
      console.log("TODO: make tx")
      this.dispatch()
      resolve()
    })
  }
}

type Props = {
}

export const ApplyView = View<ApplyController, Props, State>(
  (props, state, controller, params) => {
    // FIXME! Load opening by ID
    return (
      <FlowModal
        applications={state.applications}
        creator={state.creator}
        transactionFee={state.transactionFee}
        keypairs={state.keypairs}
        hasConfirmStep={state.hasConfirmStep}
        step={state.step}
        slots={state.slots}
        applicationDetails={state.applicationDetails}
        transactionDetails={state.transactionDetails}
        roleKeyName={state.roleKeyName}
        prepareApplicationTransaction={(...args) => controller.prepareApplicationTransaction(...args)}
        makeApplicationTransaction={() => controller.makeApplicationTransaction()}
      />
    )
  }
)
