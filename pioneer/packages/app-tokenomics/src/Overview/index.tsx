import React, { useEffect, useState } from 'react';
import getTokenomicsData, { TokenomicsData } from '../lib/getTokenomicsData';
import { api } from '@polkadot/react-api';
import OverviewTable from './OverviewTable';
import SpendingAndStakeDistributionTable from './SpendingAndStakeDistributionTable';
import TokenomicsCharts from './TokenomicsCharts';
import styled from 'styled-components';

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

export type StatusServerData = {
  dollarPool: {
    size: number;
    replenishAmount: number;
  };
  price: string;
}

const Overview: React.FC<{}> = () => {
  const [data, setData] = useState<TokenomicsData | undefined>();
  const [statusData, setStatusData] = useState<StatusServerData | undefined | null>();

  const getStatusData = async (): Promise<void> => {
    try {
      const response = await fetch('https://status.joystream.org/status');
      if (response.status >= 200 && response.status <= 299) {
        const statusData = await response.json();
        setStatusData(statusData);
      } else {
        setStatusData(null);
      }
    } catch (e) {
      console.log(e);
    }
  };

  const getApiData = async (): Promise<void> => {
    try {
      const data = await getTokenomicsData(api);
      setData(data);
    } catch (e) {
      console.log(e);
    }
  };

  useEffect(() => {
    getApiData();
    getStatusData();
  }, []);

  return (
        <>
          <Title> Overview </Title>
          <OverviewTable data={data} statusData={statusData}/>
          <Title> Spending and Stake Distribution </Title>
          <SpendingAndStakeContainer>
            <SpendingAndStakeDistributionTable data={data} statusData={statusData}/>
            <TokenomicsCharts data={data} />
          </SpendingAndStakeContainer>
        </>
  );
};

export default Overview;
