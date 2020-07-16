import React, { useState } from 'react';
import { ParsedApplication } from '../../../types/workingGroups';
import { ProfilePreviewFromStruct as MemberPreview } from '../../../MemberProfilePreview';
import { useTransport, usePromise } from '../../hooks';
import { Item, Label, Button } from 'semantic-ui-react';
import { formatBalance } from '@polkadot/util';
import { WorkingGroupKey } from '@joystream/types/common';
import PromiseComponent from '../PromiseComponent';

type ApplicationsDetailsProps = {
  applications: ParsedApplication[];
  acceptedIds?: number[];
}

export const ApplicationsDetails = ({ applications, acceptedIds }: ApplicationsDetailsProps) => {
  const rejectedApplications = acceptedIds !== undefined ? applications.filter(a => !acceptedIds.includes(a.wgApplicationId)) : [];
  const [showAll, setShowAll] = useState(!rejectedApplications.length);
  const shownApplications = applications.filter(a => showAll || acceptedIds?.includes(a.wgApplicationId));
  return (<>
    <Item.Group>
      {
        shownApplications.map(({ member, stakes, wgApplicationId, humanReadableText }) => {
          let HRT = humanReadableText.toString();
          const accepted = acceptedIds?.includes(wgApplicationId);
          try { HRT = JSON.stringify(JSON.parse(HRT), undefined, 4); } catch (e) { /* Do nothing */ }
          return (
            <Item key={wgApplicationId} style={{
              background: 'white',
              padding: '1em 1.5em',
              boxShadow: `0 0 0.5rem 1px ${accepted ? '#21ba45' : (acceptedIds !== undefined ? '#db282899' : '#00000050')}`
            }}>
              <Item.Content>
                <Item.Header><MemberPreview profile={member}></MemberPreview></Item.Header>
                <Item.Meta>
                  <Label>Application id: {wgApplicationId}</Label>
                  { stakes.application > 0 && <Label>Appl. stake: {formatBalance(stakes.application)}</Label> }
                  { stakes.role > 0 && <Label>Role stake: {formatBalance(stakes.role)}</Label> }
                </Item.Meta>
                <Item.Description>
                  <pre style={{
                    whiteSpace: 'pre-wrap',
                    fontWeight: 'normal'
                  }}>
                    {HRT}
                  </pre>
                </Item.Description>
              </Item.Content>
            </Item>
          );
        })
      }
    </Item.Group>
    {rejectedApplications.length > 0 && (
      <Button fluid onClick={() => setShowAll(current => !current)}>
        { showAll ? 'Hide rejected applications' : 'Show rejected applications' }
      </Button>
    )}
  </>);
};

type ApplicationsDetailsByIdsProps = {
  group: WorkingGroupKey;
  ids: number[];
  acceptedIds?: number[];
};

export const ApplicationsDetailsByIds = ({ group, ids, acceptedIds }: ApplicationsDetailsByIdsProps) => {
  const transport = useTransport();
  const [applications, error, loading] = usePromise<ParsedApplication[]>(
    () => Promise.all(ids.map(id => transport.workingGroups.parsedApplicationById(group, id))),
    [],
    [ids]
  );

  return (
    <PromiseComponent {...{ error, loading }} message="Fetching application(s)...">
      <ApplicationsDetails applications={applications} acceptedIds={acceptedIds}/>
    </PromiseComponent>
  );
};

type ApplicationsDetailsByOpeningProps = {
  group: WorkingGroupKey;
  openingId: number;
  acceptedIds?: number[];
};

export const ApplicationsDetailsByOpening = ({ group, openingId, acceptedIds }: ApplicationsDetailsByOpeningProps) => {
  const transport = useTransport();
  const [applications, error, loading] = usePromise<ParsedApplication[]>(
    // Cannot filter by active, otherwise the details will be broken once opening is filled!
    () => transport.workingGroups.openingApplications(group, openingId),
    [],
    [openingId]
  );

  return (
    <PromiseComponent {...{ error, loading }} message="Fetching applications...">
      <ApplicationsDetails applications={applications} acceptedIds={acceptedIds}/>
    </PromiseComponent>
  );
};
