import React from 'react';
import { Table } from 'semantic-ui-react';
import Help from './Help';
import styled from 'styled-components';

import { TokenomicsData } from '../lib/getTokenomicsData';
import { StatusServerData } from './index';

const round = (num: number): number => Math.round((num + Number.EPSILON) * 100) / 100;

const OverviewTableHelp = styled(Help)`
    position:absolute;
    cursor:pointer;
    right:2rem;
    top:0;
    @media(max-width: 767px){
      top:0.8rem;
    }
`;

const OverviewTableRow: React.FC<{item: string; value: string; help?: string}> = ({ item, value, help }) => {
  return (
    <Table.Row>
      <Table.Cell>
        <div style={{ position: 'relative' }}>
          {item}
          {help && <OverviewTableHelp position={{ right: '2rem' }} help={help} />}
        </div>
      </Table.Cell>
      <Table.Cell>{value}</Table.Cell>
    </Table.Row>
  );
};

const OverviewTable: React.FC<{data: TokenomicsData | undefined; statusData: StatusServerData | undefined | null}> = ({ data, statusData }) => {
  return (
    <Table style={{ marginBottom: '1.5rem' }} celled>
      <Table.Header>
        <Table.Row>
          <Table.HeaderCell width={10}>Item</Table.HeaderCell>
          <Table.HeaderCell width={2}>Value</Table.HeaderCell>
        </Table.Row>
      </Table.Header>

      <Table.Body>
        <OverviewTableRow
          item='Total Issuance'
          help='The current supply of tokens.'
          value={data ? `${data.totalIssuance} JOY` : 'Loading...'}
        />
        <OverviewTableRow
          item='Fiat Pool'
          help='The current value of the Fiat Pool.'
          value={statusData === null ? 'Data currently unavailable..' : statusData ? `${round(statusData.dollarPool.size)} USD` : 'Loading...'}
        />
        <OverviewTableRow
          item='Currently Staked Tokens'
          value={data ? `${data.currentlyStakedTokens} JOY` : 'Loading...'}
          help='All tokens currently staked for active roles.'
        />
        <OverviewTableRow
          item='Currently Staked Value'
          value={statusData === null ? 'Data currently unavailable..' : (data && statusData) ? `${round(data.currentlyStakedTokens * Number(statusData.price))} USD` : 'Loading...'}
          help='The value of all tokens currently staked for active roles.'
        />
        <OverviewTableRow
          item='Exchange Rate'
          value={statusData === null ? 'Data currently unavailable..' : statusData ? `${round(Number(statusData.price) * 1000000)} USD/1MJOY` : 'Loading...'}
          help='The current exchange rate.'
        />
        {/* <OverviewTableRow help='Sum of all tokens burned through exchanges' item='Total Tokens Burned/Exchanged' value={statusData ? `${statusData.burned} JOY` : 'Loading...'}/> */}
        <OverviewTableRow
          item='Projected Weekly Token Mint Rate'
          value={data ? `${Math.round(data.totalWeeklySpending)} JOY` : 'Loading...'}
          help='Projection of tokens minted over the next week, based on current rewards for all roles.'
        />
        <OverviewTableRow
          item='Projected Weekly Token Inflation Rate'
          value={data ? `${round((data.totalWeeklySpending / data.totalIssuance) * 100)} %` : 'Loading...'}
          help={'Based on \'Projected Weekly Token Mint Rate\'. Does not include any deflationary forces (fees, slashes, burns, etc.)'}
        />
        <OverviewTableRow
          item='Projected Weekly Value Of Mint'
          value={statusData === null ? 'Data currently unavailable..' : (data && statusData) ? `${round(data.totalWeeklySpending * Number(statusData.price))} USD` : 'Loading...'}
          help={'Based on \'Projected Weekly Token Mint Rate\', and current \'Exchange Rate\'.'}
        />
        <OverviewTableRow
          item='Weekly Top Ups'
          value={statusData === null ? 'Data currently unavailable..' : statusData ? `${statusData.dollarPool.replenishAmount} USD` : 'Loading...'}
          help={'The current weekly \'Fiat Pool\' replenishment amount. Does not include KPIs, or other potential top ups.'}
        />
      </Table.Body>
    </Table>
  );
};

export default OverviewTable;
