import React from 'react';
import { Table, Popup, Icon } from 'semantic-ui-react';
import styled from 'styled-components';
import { useWindowDimensions } from '../../../joy-utils/src/react/hooks';

import { TokenomicsData, StatusServerData } from '@polkadot/joy-utils/src/types/tokenomics';

import { COLORS } from './index';

const round = (num: number): number => Math.round((num + Number.EPSILON) * 100) / 100;

const applyCss = (columns: number[]): string => {
  let columnString = '';

  columns.forEach((column, index) => {
    if (index === 0) {
      columnString += `td:nth-of-type(${column}), th:nth-of-type(${column})`;
    } else {
      columnString += ` ,td:nth-of-type(${column}), th:nth-of-type(${column})`;
    }
  });

  return columnString;
};

const StyledTable = styled(({ divideColumnsAt, ...rest }) => <Table {...rest} />)`
  border: none !important;
  width: 70% !important;
  margin-bottom:1.5rem;
  @media (max-width: 1400px){
    width:100% !important;
  }
  & tr {
    td:nth-of-type(1),
    th:nth-of-type(1),
    ${(props: { divideColumnsAt: number[]}): string => applyCss(props.divideColumnsAt)} {
      border-left: 0.12rem solid rgba(20,20,20,0.3) !important;
    }
    td:nth-of-type(1){
      position: relative !important;
    }
    td:last-child, th:last-child{
      border-right: 0.12rem solid rgba(20,20,20,0.3) !important;
    }
  }
  & tr:last-child > td{
    border-bottom: 0.12rem solid rgba(20,20,20,0.3) !important;
  }
  & tr:last-child > td:nth-of-type(1){
    border-bottom-left-radius: 0.2rem !important;
  }
  & tr:last-child > td:last-child{
    border-bottom-right-radius: 0.2rem !important;
  }
  th{
    border-top: 0.12rem solid rgba(20,20,20,0.3) !important;
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

const StyledTableRow = styled(Table.Row)`
  .help-icon{
    position: absolute !important;
    right: 0.5rem !important;
    top: 0.8rem !important;
    @media (max-width: 767px){
      top:0.8rem !important;
    }
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
}> = ({ role, numberOfActors, groupEarning, groupEarningDollar, earningShare, groupStake, groupStakeDollar, stakeShare, color, active, helpContent }) => {
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
    <StyledTableRow color={active && 'rgb(150, 150, 150)'}>
      <Table.Cell>
        {active ? <strong>{role}</strong> : role}
        {helpContent && <Popup
          trigger={<Icon className='help-icon' name='help circle' color='grey'/>}
          content={helpContent}
          position='right center'
        />}
      </Table.Cell>
      <Table.Cell>{parseData(numberOfActors)}</Table.Cell>
      <Table.Cell>{parseData(groupEarning)}</Table.Cell>
      <Table.Cell>{parseData(groupEarningDollar)}</Table.Cell>
      <Table.Cell>{parseData(earningShare)}</Table.Cell>
      <Table.Cell>{parseData(groupStake)}</Table.Cell>
      <Table.Cell>{parseData(groupStakeDollar)}</Table.Cell>
      <Table.Cell>{parseData(stakeShare)}</Table.Cell>
      <Table.Cell><div className='tableColorBlock' style={{ backgroundColor: color }}></div></Table.Cell>
    </StyledTableRow>
  );
};

type TokenomicsGroup =
  'validators' |
  'council' |
  'storageProviders' |
  'contentCurators' |
  'operations'

const SpendingAndStakeDistributionTable: React.FC<{data?: TokenomicsData; statusData?: StatusServerData | null}> = ({ data, statusData }) => {
  const { width } = useWindowDimensions();

  const displayStatusData = (group: TokenomicsGroup, dataType: 'rewardsPerWeek' | 'totalStake', lead = false): string | undefined => {
    if ((group === 'storageProviders' || group === 'contentCurators') && lead) {
      return statusData === null
        ? 'Data currently unavailable...'
        : (data && statusData) && `${(data[group].lead[dataType] * Number(statusData.price)).toFixed(2)}`;
    } else {
      return statusData === null
        ? 'Data currently unavailable...'
        : (data && statusData) && `${(data[group][dataType] * Number(statusData.price)).toFixed(2)}`;
    }
  };

  return (
    <StyledTable divideColumnsAt={[3, 6, 9]} celled>
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
          numberOfActors={data && `${data.validators.number} (${data.validators.nominators.number})`}
          groupEarning={data && `${Math.round(data.validators.rewardsPerWeek)}`}
          groupEarningDollar={displayStatusData('validators', 'rewardsPerWeek')}
          earningShare={data && `${round(data.validators.rewardsShare * 100)}`}
          groupStake={data && `${data.validators.totalStake}`}
          groupStakeDollar={displayStatusData('validators', 'totalStake')}
          stakeShare={data && `${round(data.validators.stakeShare * 100)}`}
          color={COLORS.VALIDATOR}
        />
        <SpendingAndStakeTableRow
          role={width <= 1015 ? 'Council' : 'Council Members'}
          helpContent='The current Council Members, and the sum of their projected rewards and total stakes (including voters/backers).'
          numberOfActors={data && `${data.council.number}`}
          groupEarning={data && `${Math.round(data.council.rewardsPerWeek)}`}
          groupEarningDollar={displayStatusData('council', 'rewardsPerWeek')}
          earningShare={data && `${round(data.council.rewardsShare * 100)}`}
          groupStake={data && `${data.council.totalStake}`}
          groupStakeDollar={displayStatusData('council', 'totalStake')}
          stakeShare={data && `${round(data.council.stakeShare * 100)}`}
          color={COLORS.COUNCIL_MEMBER}
        />
        <SpendingAndStakeTableRow
          role={width <= 1015 ? 'Storage' : 'Storage Providers'}
          helpContent='The current Storage Providers, and the sum of their projected rewards and stakes.'
          numberOfActors={data && `${data.storageProviders.number}`}
          groupEarning={data && `${Math.round(data.storageProviders.rewardsPerWeek)}`}
          groupEarningDollar={displayStatusData('storageProviders', 'rewardsPerWeek')}
          earningShare={data && `${round(data.storageProviders.rewardsShare * 100)}`}
          groupStake={data && `${data.storageProviders.totalStake}`}
          groupStakeDollar={displayStatusData('storageProviders', 'totalStake')}
          stakeShare={data && `${round(data.storageProviders.stakeShare * 100)}`}
          color={COLORS.STORAGE_PROVIDER}
        />
        <SpendingAndStakeTableRow
          role={width <= 1015 ? 'S. Lead' : width <= 1050 ? 'Storage Lead' : 'Storage Provider Lead'}
          helpContent='Current Storage Provider Lead, and their projected reward and stake.'
          numberOfActors={data && `${data.storageProviders.lead.number}`}
          groupEarning={data && `${Math.round(data.storageProviders.lead.rewardsPerWeek)}`}
          groupEarningDollar={displayStatusData('storageProviders', 'rewardsPerWeek', true)}
          earningShare={data && `${round(data.storageProviders.lead.rewardsShare * 100)}`}
          groupStake={data && `${data.storageProviders.lead.totalStake}`}
          groupStakeDollar={displayStatusData('storageProviders', 'totalStake', true)}
          stakeShare={data && `${round(data.storageProviders.lead.stakeShare * 100)}`}
          color={COLORS.STORAGE_LEAD}
        />
        <SpendingAndStakeTableRow
          role={width <= 1015 ? 'Curators' : 'Content Curators'}
          helpContent='The current Content Curators, and the sum of their projected rewards and stakes.'
          numberOfActors={data && `${data.contentCurators.number}`}
          groupEarning={data && `${Math.round(data.contentCurators.rewardsPerWeek)}`}
          groupEarningDollar={displayStatusData('contentCurators', 'rewardsPerWeek')}
          earningShare={data && `${round(data.contentCurators.rewardsShare * 100)}`}
          groupStake={data && `${data.contentCurators.totalStake}`}
          groupStakeDollar={displayStatusData('contentCurators', 'totalStake')}
          stakeShare={data && `${round(data.contentCurators.stakeShare * 100)}`}
          color={COLORS.CONTENT_CURATOR}
        />
        <SpendingAndStakeTableRow
          role={width <= 1015 ? 'C. Lead' : 'Curators Lead'}
          helpContent='Current Content Curators Lead, and their projected reward and stake.'
          numberOfActors={data && `${data.contentCurators.lead.number}`}
          groupEarning={data && `${Math.round(data.contentCurators.lead.rewardsPerWeek)}`}
          groupEarningDollar={displayStatusData('contentCurators', 'rewardsPerWeek', true)}
          earningShare={data && `${round(data.contentCurators.lead.rewardsShare * 100)}`}
          groupStake={data && `${data.contentCurators.lead.totalStake}`}
          groupStakeDollar={displayStatusData('contentCurators', 'totalStake', true)}
          stakeShare={data && `${round(data.contentCurators.lead.stakeShare * 100)}`}
          color={COLORS.CURATOR_LEAD}
        />
        <SpendingAndStakeTableRow
          role='Operations'
          helpContent='The current Operations members, and the sum of their projected rewards and stakes.'
          numberOfActors={data && `${data.operations.number}`}
          groupEarning={data && `${Math.round(data.operations.rewardsPerWeek)}`}
          groupEarningDollar={displayStatusData('operations', 'rewardsPerWeek')}
          earningShare={data && `${round(data.operations.rewardsShare * 100)}`}
          groupStake={data && `${data.operations.totalStake}`}
          groupStakeDollar={displayStatusData('operations', 'totalStake')}
          stakeShare={data && `${round(data.operations.stakeShare * 100)}`}
          color={COLORS.OPERATIONS}
        />
        <SpendingAndStakeTableRow
          role='Operations Lead'
          helpContent='Current Operations Lead, and their projected reward and stake.'
          numberOfActors={data && `${data.operations.lead.number}`}
          groupEarning={data && `${Math.round(data.operations.lead.rewardsPerWeek)}`}
          groupEarningDollar={displayStatusData('operations', 'rewardsPerWeek', true)}
          earningShare={data && `${round(data.operations.lead.rewardsShare * 100)}`}
          groupStake={data && `${data.operations.lead.totalStake}`}
          groupStakeDollar={displayStatusData('operations', 'totalStake', true)}
          stakeShare={data && `${round(data.operations.lead.stakeShare * 100)}`}
          color={COLORS.OPERATIONS_LEAD}
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
