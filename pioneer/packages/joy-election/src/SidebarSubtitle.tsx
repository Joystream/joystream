/** Component providing election stage subtitle for SideBar menu **/
import React from 'react';
import { ElectionStage } from '@joystream/types/council';
import { Option } from '@polkadot/types/codec';
import { useApi, useCall } from '@polkadot/react-hooks';
import styled from 'styled-components';

const colorByStage = {
  Announcing: '#4caf50',
  Voting: '#2196f3',
  Revealing: '#ff5722'
} as const;

type StyledSubtitleProps = {
  stage?: keyof typeof colorByStage;
}
const StyledSubtitle = styled.div`
  display: block;
  font-size: 0.85rem;
  color: ${(props: StyledSubtitleProps) => props.stage ? colorByStage[props.stage] : 'grey'};
`;

export default function SidebarSubtitle () {
  const apiProps = useApi();
  const electionStage = useCall<Option<ElectionStage>>(apiProps.isApiReady && apiProps.api.query.councilElection.stage, []);

  if (electionStage) {
    const stageName = electionStage.unwrapOr(undefined)?.type;
    const text = stageName ? `${stageName} stage` : 'No active election';

    return <StyledSubtitle stage={stageName}>{text}</StyledSubtitle>;
  }

  return null;
}
