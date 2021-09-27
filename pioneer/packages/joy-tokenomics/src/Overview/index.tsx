import React from 'react';
import OverviewTable from './OverviewTable';
import SpendingAndStakeDistributionTable from './SpendingAndStakeDistributionTable';
import TokenomicsCharts from './TokenomicsCharts';
import styled from 'styled-components';

import usePromise from '@polkadot/joy-utils/react/hooks/usePromise';
import { useTransport } from '@polkadot/joy-utils/react/hooks';
import { StatusServerData } from '@polkadot/joy-utils/src/types/tokenomics';

const SpendingAndStakeContainer = styled('div')`
  display:flex;
  justify-content:space-between;
  @media (max-width: 1400px){
    flex-direction:column;
  }
`;

const Title = styled('h2')`
  border-bottom: 1px solid #ddd;
  margin: 0 0 2rem 0;
`;

const StyledTokenomicsCharts = styled(TokenomicsCharts)`
  width:30%;
  display:flex;
  align-items:center;
  justify-content:space-evenly;
  padding: 2rem 0;
  @media (max-width: 1400px){
    width:100%;
  }
  @media (max-width: 550px){
    flex-direction:column;
    & > div {
      margin-bottom: 1.5rem;
    }
  }
`;

const COLORS = {
  VALIDATOR: '#ff9800',
  COUNCIL_MEMBER: '#ffc107',
  STORAGE_PROVIDER: '#ffeb3b',
  STORAGE_LEAD: '#cddc39',
  CONTENT_CURATOR: '#8bc34a',
  CURATOR_LEAD: '#4caf50',
  OPERATIONS_ALPHA: '#009688',
  OPERATIONS_ALPHA_LEAD: '#00bcd4',
  OPERATIONS_BETA: '#03a9f4',
  OPERATIONS_BETA_LEAD: '#2196f3',
  OPERATIONS_GAMMA: '#3f51b5',
  OPERATIONS_GAMMA_LEAD: '#673ab7'
};

const Overview: React.FC = () => {
  const transport = useTransport();
  const [statusDataValue, statusDataError] = usePromise<StatusServerData | undefined>(() => fetch('https://status.joystream.org/status').then((res) => res.json().then((data) => data as StatusServerData)), undefined, []);
  const [tokenomicsData] = usePromise(() => transport.tokenomics.getTokenomicsData(), undefined, []);

  return (
    <>
      <Title> Overview </Title>
      <OverviewTable data={tokenomicsData} statusData={statusDataError ? null : statusDataValue}/>
      <Title> Spending and Stake Distribution </Title>
      <SpendingAndStakeContainer>
        <SpendingAndStakeDistributionTable data={tokenomicsData} statusData={statusDataError ? null : statusDataValue}/>
        <StyledTokenomicsCharts data={tokenomicsData} />
      </SpendingAndStakeContainer>
    </>
  );
};

export default Overview;
export { COLORS };
