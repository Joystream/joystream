import React from 'react';
import { Table, Popup, Icon } from 'semantic-ui-react';
import styled from 'styled-components';

import { TokenomicsData, StatusServerData } from '@polkadot/joy-utils/src/types/tokenomics';

const StyledTableRow = styled(Table.Row)`
  .help-icon{
    position: absolute !important;
    right: 0rem !important;
    top: 0 !important;
    @media (max-width: 767px){
      right: 1rem !important;
      top:0.8rem !important;
    }
  }
`;

const OverviewTableRow: React.FC<{item: string; value: string; help?: string}> = ({ item, value, help }) => {
  return (
    <StyledTableRow>
      <Table.Cell>
        <div style={{ position: 'relative' }}>
          {item}
          {help &&
            <Popup
              trigger={<Icon className='help-icon' name='help circle' color='grey'/>}
              content={help}
              position='right center'
            />}
        </div>
      </Table.Cell>
      <Table.Cell>{value}</Table.Cell>
    </StyledTableRow>
  );
};

const OverviewTable: React.FC<{data?: TokenomicsData; statusData?: StatusServerData | null}> = ({ data, statusData }) => {
  const displayStatusData = (val: string, unit: string): string => (
    statusData === null ? 'Data currently unavailable...' : statusData ? `${val} ${unit}` : 'Loading...'
  );

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
          value={displayStatusData(statusData?.dollarPool.size.toFixed(2) || '', 'USD')}
        />
        <OverviewTableRow
          item='Currently Staked Tokens'
          value={data ? `${data.currentlyStakedTokens} JOY` : 'Loading...'}
          help='All tokens currently staked for active roles.'
        />
        <OverviewTableRow
          item='Currently Staked Value'
          value={ data ? displayStatusData(`${(data.currentlyStakedTokens * Number(statusData?.price)).toFixed(2)}`, 'USD') : 'Loading...' }
          help='The value of all tokens currently staked for active roles.'
        />
        <OverviewTableRow
          item='Exchange Rate'
          value={displayStatusData(`${(Number(statusData?.price) * 1000000).toFixed(2)}`, 'USD/1MJOY')}
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
          value={data ? `${((data.totalWeeklySpending / data.totalIssuance) * 100).toFixed(2)} %` : 'Loading...'}
          help={'Based on \'Projected Weekly Token Mint Rate\'. Does not include any deflationary forces (fees, slashes, burns, etc.)'}
        />
        <OverviewTableRow
          item='Projected Weekly Value Of Mint'
          value={ data ? displayStatusData(`${(data.totalWeeklySpending * Number(statusData?.price)).toFixed(2)}`, 'USD') : 'Loading...'}
          help={'Based on \'Projected Weekly Token Mint Rate\', and current \'Exchange Rate\'.'}
        />
        <OverviewTableRow
          item='Weekly Top Ups'
          value={displayStatusData(Number(statusData?.dollarPool.replenishAmount).toFixed(2) || '', 'USD')}
          help={'The current weekly \'Fiat Pool\' replenishment amount. Does not include KPIs, or other potential top ups.'}
        />
      </Table.Body>
    </Table>
  );
};

export default OverviewTable;
