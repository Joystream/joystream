import React from 'react';
import { Table } from 'semantic-ui-react';
import styled from 'styled-components';
import Help from './Help';
import useWindowDimensions from './hooks/useWindowDimensions';

import { TokenomicsData } from '../lib/getTokenomicsData';
import { StatusServerData } from './index';

const round = (num: number): number => Math.round((num + Number.EPSILON) * 100) / 100;

const StyledTable = styled(Table)`
  border: none !important;
  width: 70% !important;
  margin-bottom:1.5rem;
  @media (max-width: 1400px){
    width:100% !important;
  }
  & > tbody > tr{
    td:nth-of-type(1), td:nth-of-type(3), td:nth-of-type(6){
      border-left: 0.12rem solid rgba(20,20,20,0.3) !important;
    }
    td:nth-of-type(9){
      border-right: 0.12rem solid rgba(20,20,20,0.3) !important;
      border-left:0.12rem solid rgba(20,20,20,0.3) !important;
    }
  }
  & > tbody > tr:nth-of-type(6){
    td{
      border-bottom: 0.12rem solid rgba(20,20,20,0.3) !important;
    }
    td:nth-of-type(1){
      border-bottom-left-radius: .28571429rem !important;
    }
    td:nth-of-type(9){
      border-bottom-right-radius: .28571429rem !important;
    }
  }
  & > thead > tr{
    th{
      border-top: 0.12rem solid rgba(20,20,20,0.3) !important;
    }
    th:nth-of-type(1), th:nth-of-type(3), th:nth-of-type(6){
      border-left: 0.12rem solid rgba(20,20,20,0.3) !important;
    }
    th:nth-of-type(9){
      border-right:0.12rem solid rgba(20,20,20,0.3) !important;
      border-left:0.12rem solid rgba(20,20,20,0.3) !important;
    }
  }
  & > tbody > tr > td:nth-of-type(1){
    position:relative !important;
  }
  & .tableColorBlock{
    height: 1rem;
    width:1rem;
    margin: 0 auto;
    @media (max-width: 768px){
      margin: 0;
    }
  }
`;

const SpendingAndStakeDistributionTableHelp = styled(Help)`
    position:absolute;
    cursor:pointer;
    right:1.7rem;
    top:0.7rem;
    @media(max-width: 767px){
      top:0.8rem;
      right:3rem;
    }
`;

const SpendingAndStakeTableRow: React.FC<{
  role: string;
  numberOfActors?: string;
  groupEarning?: string;
  groupEarningDollar?: string;
  earningShare?: string;
  groupStake?: string;
  groupStakeDollar?: string;
  stakeShare?: string;
  color?: string;
  active?: boolean;
  helpContent?: string;
  helpPosition?: string;
}> = ({ role, numberOfActors, groupEarning, groupEarningDollar, earningShare, groupStake, groupStakeDollar, stakeShare, color, active, helpContent, helpPosition }) => {
  const parseData = (data: string | undefined): string | JSX.Element => {
    if (data && active) {
      return <em>{data}</em>;
    } else if (data) {
      return data;
    } else {
      return 'Loading..';
    }
  };

  return (
    <Table.Row color={active && 'rgb(150, 150, 150)'}>
      <Table.Cell>
        {active ? <strong>{role}</strong> : role}
        {(helpContent && helpPosition) && <SpendingAndStakeDistributionTableHelp position={helpPosition === 'left' ? { left: '2rem' } : { right: '2rem' }} help={helpContent} />}
      </Table.Cell>
      <Table.Cell>{parseData(numberOfActors)}</Table.Cell>
      <Table.Cell>{parseData(groupEarning)}</Table.Cell>
      <Table.Cell>{parseData(groupEarningDollar)}</Table.Cell>
      <Table.Cell>{parseData(earningShare)}</Table.Cell>
      <Table.Cell>{parseData(groupStake)}</Table.Cell>
      <Table.Cell>{parseData(groupStakeDollar)}</Table.Cell>
      <Table.Cell>{parseData(stakeShare)}</Table.Cell>
      <Table.Cell><div className='tableColorBlock' style={{ backgroundColor: color }}></div></Table.Cell>
    </Table.Row>
  );
};

const SpendingAndStakeDistributionTable: React.FC<{data: TokenomicsData | undefined; statusData: StatusServerData | undefined | null}> = ({ data, statusData }) => {
  const { height, width } = useWindowDimensions();

  return (
    <StyledTable celled>
      <Table.Header>
        <Table.Row>
          <Table.HeaderCell width={4}>Group/Role</Table.HeaderCell>
          <Table.HeaderCell><div>Actors</div>[Number]</Table.HeaderCell>
          <Table.HeaderCell><div>Group earning</div> [JOY/Week]</Table.HeaderCell>
          <Table.HeaderCell><div>Group earning</div> [USD/Week]</Table.HeaderCell>
          <Table.HeaderCell><div>Share</div> [%]</Table.HeaderCell>
          <Table.HeaderCell><div>Group Stake</div> [JOY]</Table.HeaderCell>
          <Table.HeaderCell><div>Group Stake</div> [USD]</Table.HeaderCell>
          <Table.HeaderCell><div>Share</div> [%]</Table.HeaderCell>
          <Table.HeaderCell width={1}>Color</Table.HeaderCell>
        </Table.Row>
      </Table.Header>

      <Table.Body>
        <SpendingAndStakeTableRow
          role={width <= 1050 ? 'Validators' : 'Validators (Nominators)'}
          helpContent='The current set of active Validators (and Nominators), and the sum of the sets projected rewards and total stakes (including Nominators).'
          helpPosition={width <= 767 ? 'right' : 'left'}
          numberOfActors={data && `${data.validators.number} (${data.validators.nominators.number})`}
          groupEarning={data && `${Math.round(data.validators.rewardsPerWeek)}`}
          groupEarningDollar={statusData === null ? 'Data currently unavailable..' : (data && statusData) && `${round(data.validators.rewardsPerWeek * Number(statusData.price))}`}
          earningShare={data && `${round(data.validators.rewardsShare * 100)}`}
          groupStake={data && `${data.validators.totalStake}`}
          groupStakeDollar={statusData === null ? 'Data currently unavailable..' : (data && statusData) && `${round(data.validators.totalStake * Number(statusData.price))}`}
          stakeShare={data && `${round(data.validators.stakeShare * 100)}`}
          color='rgb(246, 109, 68)'
        />
        <SpendingAndStakeTableRow
          role={width <= 1015 ? 'Council' : 'Council Members'}
          helpContent='The current Council Members, and the sum of their projected rewards and total stakes (including voters/backers).'
          helpPosition={width <= 767 ? 'right' : 'left'}
          numberOfActors={data && `${data.council.number}`}
          groupEarning={data && `${Math.round(data.council.rewardsPerWeek)}`}
          groupEarningDollar={statusData === null ? 'Data currently unavailable..' : (data && statusData) && `${round(data.council.rewardsPerWeek * Number(statusData.price))}`}
          earningShare={data && `${round(data.council.rewardsShare * 100)}`}
          groupStake={data && `${data.council.totalStake}`}
          groupStakeDollar={statusData === null ? 'Data currently unavailable..' : (data && statusData) && `${round(data.council.totalStake * Number(statusData.price))}`}
          stakeShare={data && `${round(data.council.stakeShare * 100)}`}
          color='rgb(254, 174, 101)'
        />
        <SpendingAndStakeTableRow
          role={width <= 1015 ? 'Storage' : 'Storage Providers'}
          helpContent='The current Storage Providers, and the sum of their projected rewards and stakes.'
          helpPosition={width <= 767 ? 'right' : 'left'}
          numberOfActors={data && `${data.storageProviders.number}`}
          groupEarning={data && `${Math.round(data.storageProviders.rewardsPerWeek)}`}
          groupEarningDollar={statusData === null ? 'Data currently unavailable..' : (data && statusData) && `${round(data.storageProviders.rewardsPerWeek * Number(statusData.price))}`}
          earningShare={data && `${round(data.storageProviders.rewardsShare * 100)}`}
          groupStake={data && `${data.storageProviders.totalStake}`}
          groupStakeDollar={statusData === null ? 'Data currently unavailable..' : (data && statusData) && `${round(data.storageProviders.totalStake * Number(statusData.price))}`}
          stakeShare={data && `${round(data.storageProviders.stakeShare * 100)}`}
          color='rgb(230, 246, 157)'
        />
        <SpendingAndStakeTableRow
          role={width <= 1015 ? 'S. Lead' : width <= 1050 ? 'Storage Lead' : 'Storage Provider Lead'}
          helpContent='Current Storage Provider Lead, and their projected reward and stake.'
          helpPosition={width <= 767 ? 'right' : 'left'}
          numberOfActors={data && `${data.storageProviders.lead.number}`}
          groupEarning={data && `${Math.round(data.storageProviders.lead.rewardsPerWeek)}`}
          groupEarningDollar={statusData === null ? 'Data currently unavailable..' : (data && statusData) && `${round(data.storageProviders.lead.rewardsPerWeek * Number(statusData.price))}`}
          earningShare={data && `${round(data.storageProviders.lead.rewardsShare * 100)}`}
          groupStake={data && `${data.storageProviders.lead.totalStake}`}
          groupStakeDollar={statusData === null ? 'Data currently unavailable..' : (data && statusData) && `${round(data.storageProviders.lead.totalStake * Number(statusData.price))}`}
          stakeShare={data && `${round(data.storageProviders.lead.stakeShare * 100)}`}
          color='rgb(170, 222, 167)'
        />
        <SpendingAndStakeTableRow
          role={width <= 1015 ? 'Content' : 'Content Curators'}
          helpContent='The current Content Curators (and their Lead), and the sum of their projected rewards and stakes.'
          helpPosition={width <= 767 ? 'right' : 'left'}
          numberOfActors={data && `${data.contentCurators.number} (${data.contentCurators.contentCuratorLead})`}
          groupEarning={data && `${Math.round(data.contentCurators.rewardsPerWeek)}`}
          groupEarningDollar={statusData === null ? 'Data currently unavailable..' : (data && statusData) && `${round(data.contentCurators.rewardsPerWeek * Number(statusData.price))}`}
          earningShare={data && `${round(data.contentCurators.rewardsShare * 100)}`}
          groupStake={data && `${data.contentCurators.totalStake}`}
          groupStakeDollar={statusData === null ? 'Data currently unavailable..' : (data && statusData) && `${round(data.contentCurators.totalStake * Number(statusData.price))}`}
          stakeShare={data && `${round(data.contentCurators.stakeShare * 100)}`}
          color='rgb(100, 194, 166)'
        />
        <SpendingAndStakeTableRow
          role='TOTAL'
          active={true}
          numberOfActors={data && `${data.totalNumberOfActors}`}
          groupEarning={data && `${Math.round(data.totalWeeklySpending)}`}
          groupEarningDollar={statusData === null ? 'Data currently unavailable..' : (data && statusData) && `${round(data.totalWeeklySpending * Number(statusData.price))}`}
          earningShare={data && '100'}
          groupStake={data && `${data.currentlyStakedTokens}`}
          groupStakeDollar={statusData === null ? 'Data currently unavailable..' : (data && statusData) && `${round(data.currentlyStakedTokens * Number(statusData.price))}`}
          stakeShare={data && '100'}
        />
      </Table.Body>
    </StyledTable>
  );
};

export default SpendingAndStakeDistributionTable;
