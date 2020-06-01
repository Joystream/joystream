import React from "react";
import AddressMini from "@polkadot/react-components/AddressMiniJoy";
import MemberByAccount from "@polkadot/joy-utils/MemberByAccountPreview";
import { AccountId } from "@polkadot/types/interfaces";

import styled from 'styled-components';

const StyledCouncilCandidate = styled.div`
  display: flex;
  flex-wrap: wrap;
  padding: 1rem;
`;

const CandidateMembership = styled.div``;

const CandidateAddress = styled.div`
  margin-left: auto;
`;

type CouncilCandidateProps = {
  accountId: AccountId | string;
};

const CouncilCandidate: React.FunctionComponent<CouncilCandidateProps> = ({ accountId }) => (
  <StyledCouncilCandidate>
    <CandidateMembership>
      <MemberByAccount accountId={accountId} />
    </CandidateMembership>
    <CandidateAddress>
      <AddressMini value={accountId} isShort={false} isPadded={false} withBalance={true} />
    </CandidateAddress>
  </StyledCouncilCandidate>
);

export default CouncilCandidate;
