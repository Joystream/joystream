import "../index.css";
import {
  SignalForm,
  EvictStorageProviderForm,
  SpendingProposalForm,
  SetCouncilParamsForm,
  SetContentWorkingGroupLeadForm,
  SetStorageRoleParamsForm,
  RuntimeUpgradeForm,
  SetContentWorkingGroupMintCapForm,
  SetCouncilMintCapForm,
  SetMaxValidatorCountForm
} from "../forms";
import withMock from './withMock';

export default {
  title: "Proposals | Forms"
};

export const Signal = () => withMock(SignalForm);

export const StorageProviders = () => withMock(EvictStorageProviderForm);

export const SpendingProposal = () => withMock(SpendingProposalForm);

export const SetCouncilParams = () => withMock(SetCouncilParamsForm);

export const SetContentWorkingGroupLead = () => withMock(SetContentWorkingGroupLeadForm);

export const SetStorageRoleParams = () => withMock(SetStorageRoleParamsForm);

export const RuntimeUpgrade = () => withMock(RuntimeUpgradeForm);

export const ContentWorkingGroupMintCap = () => withMock(SetContentWorkingGroupMintCapForm);

export const CouncilMintCap = () => withMock(SetCouncilMintCapForm);

export const SetMaxValidatorCount = () => withMock(SetMaxValidatorCountForm);
