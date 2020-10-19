import React from 'react';
import { Icon, Label } from 'semantic-ui-react';
import PieChart from '../../../react-components/src/Chart/PieChart';
import styled from 'styled-components';

import { TokenomicsData } from '@joystream/js/lib/types/tokenomics';

const StyledPieChart = styled(PieChart)`
  width:15rem;
  height:15rem;
  margin-bottom:1rem;
  @media (max-width: 1650px){
    height:12rem;
    width:12rem;
  }
  @media (max-width: 1400px){
    height:15rem;
    width:15rem;
  }
`;

const ChartContainer = styled('div')`
  display:flex;
  flex-direction:column;
  align-items:center;
`;

const TokenomicsCharts: React.FC<{data?: TokenomicsData; className?: string}> = ({ data, className }) => {
  return (
    <div className={className}>
      {data ? <ChartContainer>
        <StyledPieChart
          values={[{
            colors: ['rgb(246, 109, 68)'],
            label: 'Validators',
            value: data.validators.rewardsShare * 100
          }, {
            colors: ['rgb(254, 174, 101)'],
            label: 'Council',
            value: data.council.rewardsShare * 100
          }, {
            colors: ['rgb(230, 246, 157)'],
            label: 'Storage Providers',
            value: data.storageProviders.rewardsShare * 100
          }, {
            colors: ['rgb(170, 222, 167)'],
            label: 'Storage Lead',
            value: data.storageProviders.lead.rewardsShare * 100
          }, {
            colors: ['rgb(100, 194, 166)'],
            label: 'Content Curators',
            value: data.contentCurators.rewardsShare * 100
          }, {
            colors: ['rgb(100, 160, 190)'],
            label: 'Content Curators Lead',
            value: data.contentCurators.lead.rewardsShare * 100
          }
          ]} />
        <Label as='div'>
          <Icon name='money' />
          <span style={{ fontWeight: 600 }}>Spending</span>
        </Label>
      </ChartContainer> : <Icon name='circle notched' loading/>}
      {data ? <ChartContainer>
        <StyledPieChart
          values={[{
            colors: ['rgb(246, 109, 68)'],
            label: 'Validators',
            value: data.validators.stakeShare * 100
          }, {
            colors: ['rgb(254, 174, 101)'],
            label: 'Council',
            value: data.council.stakeShare * 100
          }, {
            colors: ['rgb(230, 246, 157)'],
            label: 'Storage Providers',
            value: data.storageProviders.stakeShare * 100
          }, {
            colors: ['rgb(170, 222, 167)'],
            label: 'Storage Lead',
            value: data.storageProviders.lead.stakeShare * 100
          }, {
            colors: ['rgb(100, 194, 166)'],
            label: 'Content Curators',
            value: data.contentCurators.stakeShare * 100
          },
          {
            colors: ['rgb(100, 160, 190)'],
            label: 'Content Curators Lead',
            value: data.contentCurators.lead.stakeShare * 100
          }
          ]} />
        <Label as='div'>
          <Icon name='block layout' />
          <span style={{ fontWeight: 600 }}>Stake</span>
        </Label>
      </ChartContainer> : <Icon name='circle notched' loading/>}
    </div>
  );
};

export default TokenomicsCharts;
