import "../index.css";
import { ChooseProposalType } from "../Proposal";
import withMock from './withMock';

export default {
    title: "Proposals | Proposal Types",
};

export const Default = () => withMock(ChooseProposalType);
