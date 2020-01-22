import React from 'react';

import { formatBalance } from '@polkadot/util';
import { Balance } from '@polkadot/types/interfaces';
import AccountId from '@polkadot/types/primitive/Generic/AccountId';

import { Controller, Params, View } from '@polkadot/joy-utils/index'

import { GenericJoyStreamRoleSchema } from '@joystream/types/hiring/schemas/role.schema'

import { ITransport } from '../transport'

import { keyPairDetails, FlowModal } from './apply'

import { GroupMember } from '../elements'
import { OpeningStakeAndApplicationStatus } from '../tabs/Opportunities'
import { Min, Step, Sum } from "../balances"

type State = {
  // Input data from state
  role?: GenericJoyStreamRoleSchema
  applications?: OpeningStakeAndApplicationStatus
  creator?: GroupMember
  transactionFee?: Balance
  keypairs?: keyPairDetails[] // <- Where does this come from?
  hasConfirmStep?: boolean
  step?: Balance
  slots?: Balance[]

  // Data generated for transaction
  transactionDetails: Map<string, string>
  roleKeyName: string

  // Error capture and display
  hasError: boolean
}

const newEmptyState = (): State => {
  return {
    hasError: false,
    transactionDetails: new Map<string, string>(),
    roleKeyName: "",
  }
}

export class ApplyController extends Controller<State, ITransport> {
  protected currentOpeningId: string = ""

  constructor(transport: ITransport, initialState: State = newEmptyState()) {
    super(transport, initialState)

    this.transport.accounts().subscribe((keys) => this.updateAccounts(keys))
  }

  protected updateAccounts(keys: keyPairDetails[]) {
    this.state.keypairs = keys
    this.dispatch()
  }

  findOpening(params: Params) {
    const id = params.get("id")
    if (typeof id === "undefined") {
      return this.onError("ApplyController: no ID provided in params")
    }

    if (this.currentOpeningId == id) {
      return
    }

    Promise.all(
      [
        this.transport.opening(id),
        this.transport.openingApplicationRanks(id),
        this.transport.transactionFee(),
      ],
    )
      .then(
        ([opening, ranks, txFee]) => {
          const hrt = opening.opening.parse_human_readable_text()
          if (typeof hrt !== "object") {
            return this.onError("human_readable_text is not an object")
          }

          this.state.role = hrt
          this.state.applications = opening.applications
          this.state.creator = opening.creator
          this.state.transactionFee = txFee
          this.state.slots = ranks
          this.state.step = Min(Step(ranks, ranks.length))
          this.state.hasConfirmStep =
            opening.applications.requiredApplicationStake.anyRequirement() ||
            opening.applications.requiredRoleStake.anyRequirement()

          // When everything is collected, update the view
          this.dispatch()
        }
      )
      .catch(
        (err: any) => {
          this.currentOpeningId = ""
          this.onError(err)
        }
      )

    this.currentOpeningId = id
  }

  // TODO: Move to transport
  async prepareApplicationTransaction(
    applicationStake: Balance,
    roleStake: Balance,
    questionResponses: any,
    stakeKeyAddress: AccountId, stakeKeyPassphrase: string,
    txKeyAddress: AccountId, txKeyPassphrase: string,
  ): Promise<any> {
    return new Promise<any>((resolve, reject) => {
      console.log("Selected stake:", applicationStake.toString(), roleStake)
      console.log("Questions:", JSON.stringify(questionResponses))
      console.log("Stake key:", stakeKeyAddress, stakeKeyPassphrase)
      console.log("Tx key:", txKeyAddress, txKeyPassphrase)

      const totalCommitment = Sum([
        this.state.transactionFee!,
        applicationStake,
        roleStake,
      ])

      this.state.transactionDetails.set("Transaction fee", formatBalance(this.state.transactionFee))
      this.state.transactionDetails.set("Application stake", formatBalance(applicationStake))
      this.state.transactionDetails.set("Role stake", formatBalance(roleStake))
      this.state.transactionDetails.set("Total commitment", formatBalance(totalCommitment))
      this.state.transactionDetails.set("Extrinsic hash", "0xae6d24d4d55020c645ddfe2e8d0faf93b1c0c9879f9bf2c439fb6514c6d1292e")
      this.state.roleKeyName = "some-role.key"

      this.dispatch()
      resolve()
    })
  }

  async makeApplicationTransaction(): Promise<any> {
    return new Promise<any>((resolve, reject) => {
      console.log("TODO: make tx")
      this.dispatch()
      resolve()
    })
  }
}

export const ApplyView = View<ApplyController, State>(
  (state, controller, params) => {
    controller.findOpening(params)
    return (
      // @ts-ignore
      <FlowModal
        role={state.role!}
        applications={state.applications!}
        creator={state.creator!}
        transactionFee={state.transactionFee!}
        keypairs={state.keypairs!}
        hasConfirmStep={state.hasConfirmStep!}
        step={state.step!}
        slots={state.slots!}
        transactionDetails={state.transactionDetails!}
        roleKeyName={state.roleKeyName}
        prepareApplicationTransaction={(...args) => controller.prepareApplicationTransaction(...args)}
        makeApplicationTransaction={() => controller.makeApplicationTransaction()}
      />
    )
  }
)
