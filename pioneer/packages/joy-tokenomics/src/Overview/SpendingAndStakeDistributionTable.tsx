import React from 'react';
import { Table, Popup, Icon } from 'semantic-ui-react';
import styled from 'styled-components';
import { useWindowDimensions } from '../../../joy-utils/src/react/hooks';

import { TokenomicsData, StatusServerData } from '@polkadot/joy-utils/src/types/tokenomics';

import { NON_WORKING_GROUPS, WORKING_GROUPS } from '../tokenomicsGroupsData';

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

type TokenomicsGroup = typeof WORKING_GROUPS[number]['groupType'] | typeof NON_WORKING_GROUPS[number]['groupType'];

const SpendingAndStakeDistributionTable: React.FC<{data?: TokenomicsData; statusData?: StatusServerData | null}> = ({ data, statusData }) => {
  const { width } = useWindowDimensions();

  const displayStatusData = (group: TokenomicsGroup, dataType: 'rewardsPerWeek' | 'totalStake', lead = false): string | undefined => {
    if (WORKING_GROUPS.map(({ groupType }) => groupType).includes(group as any) && lead) {
      return statusData === null
        ? 'Data currently unavailable...'
        : data &&
            statusData &&
            `${(
              data[group as typeof WORKING_GROUPS[number]['groupType']].lead[dataType] * Number(statusData.price)
            ).toFixed(2)}`;
    } else {
      return statusData === null
        ? 'Data currently unavailable...'
        : data && statusData && `${(data[group][dataType] * Number(statusData.price)).toFixed(2)}`;
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
        {NON_WORKING_GROUPS.map(({ groupType, titleCutoff, shortTitle, title, helpText, color }) => {
          let numberOfActors = data && `${data[groupType].number}`;

          if (groupType === 'validators' && data) {
            numberOfActors = `${data.validators.number} (${data.validators.nominators.number})`;
          }

          return (
            <SpendingAndStakeTableRow
              key={groupType}
              role={width <= titleCutoff ? shortTitle : title}
              helpContent={helpText}
              numberOfActors={numberOfActors}
              groupEarning={data && `${Math.round(data[groupType].rewardsPerWeek)}`}
              groupEarningDollar={displayStatusData(groupType, 'rewardsPerWeek')}
              earningShare={data && `${round(data[groupType].rewardsShare * 100)}`}
              groupStake={data && `${data[groupType].totalStake}`}
              groupStakeDollar={displayStatusData(groupType, 'totalStake')}
              stakeShare={data && `${round(data[groupType].stakeShare * 100)}`}
              color={color}
            />
          );
        })}
        {WORKING_GROUPS.map(({ groupType, titleCutoff, shortTitle, title, helpText, color, lead }) => {
          return (
            <React.Fragment key={groupType}>
              <SpendingAndStakeTableRow
                role={width <= titleCutoff ? shortTitle : title}
                helpContent={helpText}
                numberOfActors={data && `${data[groupType].number}`}
                groupEarning={data && `${Math.round(data[groupType].rewardsPerWeek)}`}
                groupEarningDollar={displayStatusData(groupType, 'rewardsPerWeek')}
                earningShare={data && `${round(data[groupType].rewardsShare * 100)}`}
                groupStake={data && `${data[groupType].totalStake}`}
                groupStakeDollar={displayStatusData(groupType, 'totalStake')}
                stakeShare={data && `${round(data[groupType].stakeShare * 100)}`}
                color={color}
              />
              <SpendingAndStakeTableRow
                role={width <= lead.titleCutoff ? lead.shortTitle : lead.title}
                helpContent={lead.helpText}
                numberOfActors={data && `${data[groupType].lead.number}`}
                groupEarning={data && `${Math.round(data[groupType].lead.rewardsPerWeek)}`}
                groupEarningDollar={displayStatusData(groupType, 'rewardsPerWeek', true)}
                earningShare={data && `${round(data[groupType].lead.rewardsShare * 100)}`}
                groupStake={data && `${data[groupType].lead.totalStake}`}
                groupStakeDollar={displayStatusData(groupType, 'totalStake', true)}
                stakeShare={data && `${round(data[groupType].lead.stakeShare * 100)}`}
                color={lead.color}
              />
            </React.Fragment>
          );
        })}
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
