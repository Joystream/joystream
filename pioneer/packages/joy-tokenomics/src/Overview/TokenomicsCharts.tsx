import React from 'react';
import { Icon, Label } from 'semantic-ui-react';
import PieChart from '../../../react-components/src/Chart/PieChart';
import styled from 'styled-components';

import { TokenomicsData } from '@polkadot/joy-utils/src/types/tokenomics';
import { COLORS } from './index';

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
            colors: [COLORS.VALIDATOR],
            label: 'Validators',
            value: data.validators.rewardsShare * 100
          }, {
            colors: [COLORS.COUNCIL_MEMBER],
            label: 'Council',
            value: data.council.rewardsShare * 100
          }, {
            colors: [COLORS.STORAGE_PROVIDER],
            label: 'Storage Providers',
            value: data.storageProviders.rewardsShare * 100
          }, {
            colors: [COLORS.STORAGE_LEAD],
            label: 'Storage Lead',
            value: data.storageProviders.lead.rewardsShare * 100
          }, {
            colors: [COLORS.CONTENT_CURATOR],
            label: 'Content Curators',
            value: data.contentCurators.rewardsShare * 100
          }, {
            colors: [COLORS.CURATOR_LEAD],
            label: 'Content Curators Lead',
            value: data.contentCurators.lead.rewardsShare * 100
          }, {
            colors: [COLORS.OPERATIONS],
            label: 'Operations',
            value: data.operations.rewardsShare * 100
          }, {
            colors: [COLORS.OPERATIONS_LEAD],
            label: 'Operations Lead',
            value: data.operations.lead.rewardsShare * 100
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
            colors: [COLORS.VALIDATOR],
            label: 'Validators',
            value: data.validators.stakeShare * 100
          }, {
            colors: [COLORS.COUNCIL_MEMBER],
            label: 'Council',
            value: data.council.stakeShare * 100
          }, {
            colors: [COLORS.STORAGE_PROVIDER],
            label: 'Storage Providers',
            value: data.storageProviders.stakeShare * 100
          }, {
            colors: [COLORS.STORAGE_LEAD],
            label: 'Storage Lead',
            value: data.storageProviders.lead.stakeShare * 100
          }, {
            colors: [COLORS.CONTENT_CURATOR],
            label: 'Content Curators',
            value: data.contentCurators.stakeShare * 100
          }, {
            colors: [COLORS.CURATOR_LEAD],
            label: 'Content Curators Lead',
            value: data.contentCurators.lead.stakeShare * 100
          }, {
            colors: [COLORS.OPERATIONS],
            label: 'Operations',
            value: data.operations.stakeShare * 100
          }, {
            colors: [COLORS.OPERATIONS_LEAD],
            label: 'Operations Lead',
            value: data.operations.lead.stakeShare * 100
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
