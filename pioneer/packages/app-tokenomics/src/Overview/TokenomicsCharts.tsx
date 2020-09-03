import React from 'react';
import PieChart from './PieChart';
import { Icon } from 'semantic-ui-react';
import styled from 'styled-components';

import { TokenomicsData } from '../lib/getTokenomicsData';

const TokenomicsChartsContainer = styled('div')`
  width:30%;
  display:flex;
  align-items:center;
  justify-content:space-evenly;
  padding: 2rem 0;
  svg{
    height:15rem;
  }
  @media (max-width: 1650px){
    svg{
      height:12rem;
    }
  }
  @media (max-width: 1400px){
    width:100%;
    svg{
      height:15rem;
    }
  }
  @media (max-width: 550px){
    flex-direction:column;
    & > div {
      margin-bottom: 1.5rem;
    }
  }
`;

const TokenomicsCharts: React.FC<{data: TokenomicsData | undefined}> = ({ data }) => {
  return (
    <TokenomicsChartsContainer>
      {data
        ? <PieChart
          icon='money'
          typeOfChart='Spending'
          percentages={[
            {
              percent: data.validators.rewardsShare,
              color: 'rgb(246, 109, 68)'
            },
            {
              percent: data.council.rewardsShare,
              color: 'rgb(254, 174, 101)'
            },
            {
              percent: data.storageProviders.rewardsShare,
              color: 'rgb(230, 246, 157)'
            },
            {
              percent: data.storageProviders.lead.rewardsShare,
              color: 'rgb(170, 222, 167)'
            },
            {
              percent: data.contentCurators.rewardsShare,
              color: 'rgb(100, 194, 166)'
            }
          ]}/> : <Icon name='circle notched' loading/>}
      {data
        ? <PieChart
          icon='block layout'
          typeOfChart='Staking'
          percentages={[
            {
              percent: data.validators.stakeShare,
              color: 'rgb(246, 109, 68)'
            },
            {
              percent: data.council.stakeShare,
              color: 'rgb(254, 174, 101)'
            },
            {
              percent: data.storageProviders.stakeShare,
              color: 'rgb(230, 246, 157)'
            },
            {
              percent: data.storageProviders.lead.stakeShare,
              color: 'rgb(170, 222, 167)'
            },
            {
              percent: data.contentCurators.stakeShare,
              color: 'rgb(100, 194, 166)'
            }
          ]}/> : <Icon name='circle notched' loading />}
    </TokenomicsChartsContainer>
  );
};

export default TokenomicsCharts;
