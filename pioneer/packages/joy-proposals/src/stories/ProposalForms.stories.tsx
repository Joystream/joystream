import { SignalForm,
  SpendingProposalForm,
  SetCouncilParamsForm,
  RuntimeUpgradeForm,
  SetCouncilMintCapForm,
  SetMaxValidatorCountForm } from '../forms';
import withMock from './withMock';

export default {
  title: 'Proposals | Forms'
};

export const Signal = () => withMock(SignalForm);

export const SpendingProposal = () => withMock(SpendingProposalForm);

export const SetCouncilParams = () => withMock(SetCouncilParamsForm);

export const RuntimeUpgrade = () => withMock(RuntimeUpgradeForm);

export const CouncilMintCap = () => withMock(SetCouncilMintCapForm);

export const SetMaxValidatorCount = () => withMock(SetMaxValidatorCountForm);
