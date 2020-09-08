import React from 'react';
import getTokenomicsData from '../lib/getTokenomicsData';
import { api } from '@polkadot/react-api';
import OverviewTable from './OverviewTable';
import SpendingAndStakeDistributionTable from './SpendingAndStakeDistributionTable';
import TokenomicsCharts from './TokenomicsCharts';
import styled from 'styled-components';

import usePromise from '@polkadot/joy-utils/react/hooks/usePromise';

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

export type StatusServerData = {
  dollarPool: {
    size: number;
    replenishAmount: number;
  };
  price: string;
}

const Overview: React.FC<{}> = () => {
  const [tokenomicsData] = usePromise(() => getTokenomicsData(api), undefined, []);
  const [statusDataValue, statusDataError] = usePromise(() => fetch('https://status.joystream.org/status').then((res) => res.json()), undefined, []);

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
