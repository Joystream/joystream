import React from 'react';
import { Table } from 'semantic-ui-react';
import { ProposalStatisticsData, ProposalStatistics } from '@polkadot/joy-utils/src/types/tokenomics';

const ProposalStatisticsTableRow: React.FC<{ item: string, all: string, text: string, spending: string, workingGroups: string, networkChanges: string }> = ({
  item,
  all,
  text,
  spending,
  workingGroups,
  networkChanges
}) => {
  return (
    <Table.Row>
      <Table.Cell>{item}</Table.Cell>
      <Table.Cell>{all}</Table.Cell>
      <Table.Cell>{text}</Table.Cell>
      <Table.Cell>{spending}</Table.Cell>
      <Table.Cell>{workingGroups}</Table.Cell>
      <Table.Cell>{networkChanges}</Table.Cell>
    </Table.Row>
  );
};

const ProposalStatisticsTable: React.FC<{ data?: ProposalStatisticsData }> = ({ data }) => {
  const parseData = (proposalType: keyof ProposalStatisticsData, proposalStatistics: keyof ProposalStatistics) => {
    return data ? `${data[proposalType][proposalStatistics]}` : 'Loading..';
  };

  return (
    <Table style={{ marginBottom: '1.5rem' }} celled>
      <Table.Header>
        <Table.Row>
          <Table.HeaderCell width={3}>Active Testnet</Table.HeaderCell>
          <Table.HeaderCell width={2}>All</Table.HeaderCell>
          <Table.HeaderCell width={2}>Text</Table.HeaderCell>
          <Table.HeaderCell width={2}>Spending</Table.HeaderCell>
          <Table.HeaderCell width={2}>Working Groups</Table.HeaderCell>
          <Table.HeaderCell width={2}>Network Changes</Table.HeaderCell>
        </Table.Row>
      </Table.Header>

      <Table.Body>
        <ProposalStatisticsTableRow
          item='All Proposals'
          all={parseData('allProposals', 'all')}
          text={parseData('textProposals', 'all')}
          spending={parseData('spendingProposals', 'all')}
          workingGroups={parseData('workingGroupsProposals', 'all')}
          networkChanges={parseData('networkChangesProposals', 'all')}
        />
        <ProposalStatisticsTableRow
          item='Active Proposals'
          all={parseData('allProposals', 'Active')}
          text={parseData('textProposals', 'Active')}
          spending={parseData('spendingProposals', 'Active')}
          workingGroups={parseData('workingGroupsProposals', 'Active')}
          networkChanges={parseData('networkChangesProposals', 'Active')}
        />
        <ProposalStatisticsTableRow
          item='Approved Proposals'
          all={parseData('allProposals', 'Approved')}
          text={parseData('textProposals', 'Approved')}
          spending={parseData('spendingProposals', 'Approved')}
          workingGroups={parseData('workingGroupsProposals', 'Approved')}
          networkChanges={parseData('networkChangesProposals', 'Approved')}
        />
        <ProposalStatisticsTableRow
          item='Rejected Proposals'
          all={parseData('allProposals', 'Rejected')}
          text={parseData('textProposals', 'Rejected')}
          spending={parseData('spendingProposals', 'Rejected')}
          workingGroups={parseData('workingGroupsProposals', 'Rejected')}
          networkChanges={parseData('networkChangesProposals', 'Rejected')}
        />
        <ProposalStatisticsTableRow
          item='Expired Proposals'
          all={parseData('allProposals', 'Expired')}
          text={parseData('textProposals', 'Expired')}
          spending={parseData('spendingProposals', 'Expired')}
          workingGroups={parseData('workingGroupsProposals', 'Expired')}
          networkChanges={parseData('networkChangesProposals', 'Expired')}
        />
        <ProposalStatisticsTableRow
          item='Slashed Proposals'
          all={parseData('allProposals', 'Slashed')}
          text={parseData('textProposals', 'Slashed')}
          spending={parseData('spendingProposals', 'Slashed')}
          workingGroups={parseData('workingGroupsProposals', 'Slashed')}
          networkChanges={parseData('networkChangesProposals', 'Slashed')}
        />
        <ProposalStatisticsTableRow
          item='Cancelled Proposals'
          all={parseData('allProposals', 'Canceled')}
          text={parseData('textProposals', 'Canceled')}
          spending={parseData('spendingProposals', 'Canceled')}
          workingGroups={parseData('workingGroupsProposals', 'Canceled')}
          networkChanges={parseData('networkChangesProposals', 'Canceled')}
        />
        <ProposalStatisticsTableRow
          item='Tokens Created/Burned'
          all={parseData('allProposals', 'tokensBurned')}
          text={parseData('textProposals', 'tokensBurned')}
          spending={parseData('spendingProposals', 'tokensBurned')}
          workingGroups={parseData('workingGroupsProposals', 'tokensBurned')}
          networkChanges={parseData('networkChangesProposals', 'tokensBurned')}
        />
      </Table.Body>
    </Table>
  );
};

export default ProposalStatisticsTable;
