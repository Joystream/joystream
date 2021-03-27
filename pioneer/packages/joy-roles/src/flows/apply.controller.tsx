import React, { useEffect } from 'react';

import { formatBalance } from '@polkadot/util';
import { Balance } from '@polkadot/types/interfaces';
import { GenericAccountId as AccountId } from '@polkadot/types/generic/AccountId';

import { Controller } from '@polkadot/joy-utils/react/helpers';
import { View } from '@polkadot/joy-utils/react/hocs';

import { GenericJoyStreamRoleSchema } from '@joystream/types/hiring/schemas/role.schema.typings';

import { ITransport } from '../transport';

import { keyPairDetails, FlowModal, ProgressSteps } from './apply';

import { OpeningStakeAndApplicationStatus } from '../tabs/Opportunities';
import { Min, Step, Sum } from '../balances';
import { WorkingGroups, AvailableGroups } from '../working_groups';
import { createType } from '@joystream/types';
import { ApplicationDetailsData } from '@polkadot/joy-utils/types/workingGroups';

type State = {
  // Input data from state
  role?: GenericJoyStreamRoleSchema;
  applications?: OpeningStakeAndApplicationStatus;
  keypairs?: keyPairDetails[]; // <- Where does this come from?
  hasConfirmStep?: boolean;
  step?: Balance;
  slots?: Balance[];

  // Data captured from form
  applicationStake: Balance;
  roleStake: Balance;
  appDetails: ApplicationDetailsData;
  txKeyAddress: AccountId;
  activeStep: ProgressSteps;
  txInProgress: boolean;
  complete: boolean;

  // Data generated for transaction
  transactionDetails: Map<string, string>;
  roleKeyNameBase: string;
  roleKeyName: string;

  // Error capture and display
  hasError: boolean;
}

const newEmptyState = (): State => {
  return {
    applicationStake: createType('Balance', 0),
    roleStake: createType('Balance', 0),
    appDetails: {},
    hasError: false,
    transactionDetails: new Map<string, string>(),
    roleKeyNameBase: '',
    roleKeyName: '',
    txKeyAddress: createType('AccountId', undefined),
    activeStep: 0,
    txInProgress: false,
    complete: false
  };
};

export class ApplyController extends Controller<State, ITransport> {
  protected currentOpeningId = -1;
  protected currentGroup: WorkingGroups | null = null;

  constructor (
    transport: ITransport,
    initialState: State = newEmptyState()
  ) {
    super(transport, initialState);

    this.transport.accounts().subscribe((keys) => this.updateAccounts(keys));
  }

  protected parseGroup (group: string | undefined): WorkingGroups | undefined {
    return AvailableGroups.find((availableGroup) => availableGroup === group);
  }

  protected updateAccounts (keys: keyPairDetails[]) {
    this.state.keypairs = keys;
    this.dispatch();
  }

  findOpening (rawId: string | undefined, rawGroup: string | undefined) {
    if (!rawId) {
      return this.onError('ApplyController: no ID provided in params');
    }

    const id = parseInt(rawId);
    const group = this.parseGroup(rawGroup);

    if (!group) {
      return this.onError('ApplyController: invalid group');
    }

    if (this.currentOpeningId === id && this.currentGroup === group) {
      return;
    }

    Promise.all(
      [
        this.transport.groupOpening(group, id),
        this.transport.openingApplicationRanks(group, id)
      ]
    )
      .then(
        ([opening, ranks]) => {
          const hrt = opening.opening.parse_human_readable_text_with_fallback();

          this.state.role = hrt;
          this.state.applications = opening.applications;
          this.state.slots = ranks;
          this.state.step = Min(Step(ranks, ranks.length));
          this.state.hasConfirmStep =
            opening.applications.requiredApplicationStake.anyRequirement() ||
            opening.applications.requiredRoleStake.anyRequirement();

          this.state.applicationStake = opening.applications.requiredApplicationStake.value;
          this.state.roleStake = opening.applications.requiredRoleStake.value;

          this.state.activeStep = this.state.hasConfirmStep
            ? ProgressSteps.ConfirmStakes
            : ProgressSteps.ApplicationDetails;
          this.state.complete = false;

          this.state.roleKeyNameBase = hrt.job.title + ' role key';

          // When everything is collected, update the view
          this.dispatch();
        }
      )
      .catch(
        (err: any) => {
          this.currentOpeningId = -1;
          this.currentGroup = null;
          this.onError(err);
        }
      );

    this.currentOpeningId = id;
    this.currentGroup = group;
  }

  setApplicationStake (b: Balance): void {
    this.state.applicationStake = b;
    this.dispatch();
  }

  setRoleStake (b: Balance): void {
    this.state.roleStake = b;
    this.dispatch();
  }

  setAppDetails (v: ApplicationDetailsData): void {
    this.state.appDetails = v;
    this.dispatch();
  }

  setTxKeyAddress (v: AccountId): void {
    this.state.txKeyAddress = v;
    this.dispatch();
  }

  setActiveStep (v: ProgressSteps): void {
    this.state.activeStep = v;
    this.dispatch();
  }

  setTxInProgress (v: boolean): void {
    this.state.txInProgress = v;
    this.dispatch();
  }

  setComplete (v: boolean): void {
    this.state.complete = v;
    this.dispatch();
  }

  // eslint-disable-next-line @typescript-eslint/require-await
  async prepareApplicationTransaction (
    applicationStake: Balance,
    roleStake: Balance,
    questionResponses: any,
    txKeyAddress: AccountId
  ): Promise<any> {
    const totalCommitment = Sum([
      applicationStake,
      roleStake
    ]);

    this.state.transactionDetails.set('Application stake', formatBalance(this.state.applicationStake));
    this.state.transactionDetails.set('Role stake', formatBalance(roleStake));
    this.state.transactionDetails.set('Total commitment', formatBalance(totalCommitment));

    this.dispatch();

    return true;
  }

  private updateRoleKeyName () {
    let roleKeyNamePrefix = 0;

    do {
      this.state.roleKeyName = `${this.state.roleKeyNameBase}${(++roleKeyNamePrefix > 1 ? ` ${roleKeyNamePrefix}` : '')}`;
    } while (this.state.keypairs?.some((k) => (
      k.shortName.toLowerCase() === this.state.roleKeyName.toLowerCase()
    )));
  }

  async makeApplicationTransaction (): Promise<number> {
    if (!this.currentGroup || this.currentOpeningId < 0) {
      throw new Error('Trying to apply to unfetched opening');
    }

    this.updateRoleKeyName();

    return this.transport.applyToOpening(
      this.currentGroup,
      this.currentOpeningId,
      this.state.roleKeyName,
      this.state.txKeyAddress.toString(),
      this.state.applicationStake,
      this.state.roleStake,
      JSON.stringify(this.state.appDetails)
    );
  }
}

export const ApplyView = View<ApplyController, State>(
  ({ state, controller, params }) => {
    useEffect(() => {
      controller.findOpening(params.get('id'), params.get('group'));
    }, [params]);

    return (
      <FlowModal
        role={state.role!}
        applications={state.applications!}
        keypairs={state.keypairs!}
        hasConfirmStep={state.hasConfirmStep!}
        step={state.step!}
        slots={state.slots!}
        transactionDetails={state.transactionDetails}
        roleKeyName={state.roleKeyName}
        prepareApplicationTransaction={controller.prepareApplicationTransaction.bind(controller)}
        makeApplicationTransaction={controller.makeApplicationTransaction.bind(controller)}
        applicationStake={state.applicationStake}
        setApplicationStake={controller.setApplicationStake.bind(controller)}
        roleStake={state.roleStake}
        setRoleStake={controller.setRoleStake.bind(controller)}
        appDetails={state.appDetails}
        setAppDetails={controller.setAppDetails.bind(controller)}
        txKeyAddress={state.txKeyAddress}
        setTxKeyAddress={controller.setTxKeyAddress.bind(controller)}
        activeStep={state.activeStep}
        setActiveStep={controller.setActiveStep.bind(controller)}
        txInProgress={state.txInProgress}
        setTxInProgress={controller.setTxInProgress.bind(controller)}
        complete={state.complete}
        setComplete={controller.setComplete.bind(controller)}
      />
    );
  }
);
