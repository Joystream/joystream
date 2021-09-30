import React from 'react';
import { Icon, Label } from 'semantic-ui-react';
import PieChart from '../../../react-components/src/Chart/PieChart';
import styled from 'styled-components';

import { TokenomicsData } from '@polkadot/joy-utils/src/types/tokenomics';

import { WORKING_GROUPS, NON_WORKING_GROUPS } from '../tokenomicsGroupsData';

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
      {data ? (
        <ChartContainer>
          <StyledPieChart
            values={[
              ...WORKING_GROUPS.map(({ color, title, groupType, lead }) => [{
                colors: [color],
                label: title,
                value: data[groupType].rewardsShare * 100
              }, {
                colors: [lead.color],
                label: lead.title,
                value: data[groupType].lead.rewardsShare * 100
              }]).flat(),
              ...NON_WORKING_GROUPS.map(({ color, shortTitle, groupType }) => ({
                colors: [color],
                label: shortTitle,
                value: data[groupType].rewardsShare * 100
              }))
            ]}
          />
          <Label as='div'>
            <Icon name='money' />
            <span style={{ fontWeight: 600 }}>Spending</span>
          </Label>
        </ChartContainer>
      ) : (
        <Icon name='circle notched' loading />
      )}
      {data ? (
        <ChartContainer>
          <StyledPieChart
            values={[
              ...WORKING_GROUPS.map(({ color, title, groupType, lead }) => [{
                colors: [color],
                label: title,
                value: data[groupType].stakeShare * 100
              }, {
                colors: [lead.color],
                label: lead.title,
                value: data[groupType].lead.stakeShare * 100
              }]).flat(),
              ...NON_WORKING_GROUPS.map(({ color, shortTitle, groupType }) => ({
                colors: [color],
                label: shortTitle,
                value: data[groupType].stakeShare * 100
              }))
            ]}
          />
          <Label as='div'>
            <Icon name='block layout' />
            <span style={{ fontWeight: 600 }}>Stake</span>
          </Label>
        </ChartContainer>
      ) : (
        <Icon name='circle notched' loading />
      )}
    </div>
  );
};

export default TokenomicsCharts;
