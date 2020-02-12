import React from 'react';

import { formatBalance } from '@polkadot/util';
import { u128 } from '@polkadot/types';
import { Balance } from '@polkadot/types/interfaces';
import AccountId from '@polkadot/types/primitive/Generic/AccountId';

import { Controller, View } from '@polkadot/joy-utils/index'

import { GenericJoyStreamRoleSchema } from '@joystream/types/hiring/schemas/role.schema'

import { Container } from 'semantic-ui-react'

import { ITransport } from '../transport'

import { keyPairDetails, FlowModal, ProgressSteps } from './apply'

import { GroupMember } from '../elements'
import { OpeningStakeAndApplicationStatus } from '../tabs/Opportunities'
import { Min, Step, Sum } from "../balances"

type State = {
  // Input data from state
  role?: GenericJoyStreamRoleSchema
  applications?: OpeningStakeAndApplicationStatus
  creator?: GroupMember
  keypairs?: keyPairDetails[] // <- Where does this come from?
  hasConfirmStep?: boolean
  step?: Balance
  slots?: Balance[]

  // Data captured from form
  applicationStake: Balance
  roleStake: Balance
  appDetails: any
  txKeyAddress: AccountId
  activeStep: ProgressSteps
  txInProgress: boolean
  complete: boolean

  // Data generated for transaction
  transactionDetails: Map<string, string>
  roleKeyName: string

  // Error capture and display
  hasError: boolean
}

const newEmptyState = (): State => {
  return {
    applicationStake: new u128(0),
    roleStake: new u128(0),
    appDetails: {},
    hasError: false,
    transactionDetails: new Map<string, string>(),
    roleKeyName: "",
    txKeyAddress: new AccountId(),
    activeStep: 0,
    txInProgress: false,
    complete: false,
  }
}

export class ApplyController extends Controller<State, ITransport> {
  protected currentOpeningId: number = -1

  constructor(transport: ITransport, initialState: State = newEmptyState()) {
    super(transport, initialState)

    this.transport.accounts().subscribe((keys) => this.updateAccounts(keys))
  }

  protected updateAccounts(keys: keyPairDetails[]) {
    this.state.keypairs = keys
    this.dispatch()
  }

  findOpening(rawId: string | undefined) {
    if (!rawId) {
      return this.onError("ApplyController: no ID provided in params")
    }
    const id = parseInt(rawId)

    if (this.currentOpeningId == id) {
      return
    }

    Promise.all(
      [
        this.transport.curationGroupOpening(id),
        this.transport.openingApplicationRanks(id),
      ],
    )
      .then(
        ([opening, ranks]) => {
          const hrt = opening.opening.parse_human_readable_text()
          if (typeof hrt !== "object") {
            return this.onError("human_readable_text is not an object")
          }

          this.state.role = hrt
          this.state.applications = opening.applications
          this.state.creator = opening.creator
          this.state.slots = ranks
          this.state.step = Min(Step(ranks, ranks.length))
          this.state.hasConfirmStep =
            opening.applications.requiredApplicationStake.anyRequirement() ||
            opening.applications.requiredRoleStake.anyRequirement()

          this.state.applicationStake = opening.applications.requiredApplicationStake.value
          this.state.roleStake = opening.applications.requiredRoleStake.value

          this.state.activeStep = this.state.hasConfirmStep ?
            ProgressSteps.ConfirmStakes :
            ProgressSteps.ApplicationDetails

          this.state.roleKeyName = hrt.job.title + " role key"

          // When everything is collected, update the view
          this.dispatch()
        }
      )
      .catch(
        (err: any) => {
          this.currentOpeningId = -1
          this.onError(err)
        }
      )

    this.currentOpeningId = id
  }

  setApplicationStake(b: Balance): void {
    this.state.applicationStake = b
    this.dispatch()
  }

  setRoleStake(b: Balance): void {
    this.state.roleStake = b
    this.dispatch()
  }

  setAppDetails(v: any): void {
    this.state.appDetails = v
    this.dispatch()
  }

  setTxKeyAddress(v: any): void {
    this.state.txKeyAddress = v
    this.dispatch()
  }

  setActiveStep(v: ProgressSteps): void {
    this.state.activeStep = v
    this.dispatch()
  }

  setTxInProgress(v: boolean): void {
    this.state.txInProgress = v
    this.dispatch()
  }

  setComplete(v: boolean): void {
    this.state.complete = v
    this.dispatch()
  }

  async prepareApplicationTransaction(
    applicationStake: Balance,
    roleStake: Balance,
    questionResponses: any,
    txKeyAddress: AccountId,
  ): Promise<any> {
    const totalCommitment = Sum([
      applicationStake,
      roleStake,
    ])

    this.state.transactionDetails.set("Application stake", formatBalance(this.state.applicationStake))
    this.state.transactionDetails.set("Role stake", formatBalance(roleStake))
    this.state.transactionDetails.set("Total commitment", formatBalance(totalCommitment))

    this.dispatch()
    return true
  }

  async makeApplicationTransaction(): Promise<number> {
    return this.transport.applyToCuratorOpening(
      this.currentOpeningId,
      this.state.roleKeyName,
      this.state.txKeyAddress.toString(),
      this.state.applicationStake,
      this.state.roleStake,
      JSON.stringify(this.state.appDetails),
    )
  }
}

export const ApplyView = View<ApplyController, State>(
  (state, controller, params) => {
    controller.findOpening(params.get("id"))
    return (
      <Container className="apply-flow">
        <div className="dimmer"></div>
        // @ts-ignore
        <FlowModal
          role={state.role!}
          applications={state.applications!}
          creator={state.creator!}
          keypairs={state.keypairs!}
          hasConfirmStep={state.hasConfirmStep!}
          step={state.step!}
          slots={state.slots!}
          transactionDetails={state.transactionDetails!}
          roleKeyName={state.roleKeyName}
          prepareApplicationTransaction={(...args) => controller.prepareApplicationTransaction(...args)}
          makeApplicationTransaction={() => controller.makeApplicationTransaction()}
          applicationStake={state.applicationStake}
          setApplicationStake={(v) => controller.setApplicationStake(v)}
          roleStake={state.roleStake}
          setRoleStake={(v) => controller.setRoleStake(v)}
          appDetails={state.appDetails}
          setAppDetails={(v) => controller.setAppDetails(v)}
          txKeyAddress={state.txKeyAddress}
          setTxKeyAddress={(v) => controller.setTxKeyAddress(v)}
          activeStep={state.activeStep}
          setActiveStep={(v) => controller.setActiveStep(v)}
          txInProgress={state.txInProgress}
          setTxInProgress={(v) => controller.setTxInProgress(v)}
          complete={state.complete}
          setComplete={(v) => controller.setComplete(v)}
        />
      </Container>
    )
  }
)
