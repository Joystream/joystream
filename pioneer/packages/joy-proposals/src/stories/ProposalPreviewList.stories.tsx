import "../index.css";
import { ProposalPreviewList } from "../Proposal";
import withMock from './withMock';

export default {
    title: "Proposals | Preview List",
};

export const Default = () => withMock(ProposalPreviewList);
