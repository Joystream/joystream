import React from 'react';
import { LeadData } from '../../../types/workingGroups';
import { ProfilePreviewFromStruct as MemberPreview } from '../../../MemberProfilePreview';
import { Label, Message } from 'semantic-ui-react';
import { formatBalance } from '@polkadot/util';
import { WorkingGroupKeys } from '@joystream/types/common';
import { useTransport, usePromise } from '../../hooks';
import PromiseComponent from '../PromiseComponent';

type LeadInfoProps = {
  lead: LeadData | null;
  group?: WorkingGroupKeys;
  header?: boolean;
};

export const LeadInfo = ({ lead, group, header = false }: LeadInfoProps) => (
  <Message>
    <Message.Content>
      { header && <Message.Header>Current {group && `${group} `}Working Group lead:</Message.Header> }
      <div style={{ padding: '0.5rem 0' }}>
        { lead
          ? (
            <MemberPreview profile={lead.profile}>
              <Label>Role stake: { lead.stake ? formatBalance(lead.stake) : 'NONE'}</Label>
            </MemberPreview>
          ) : 'NONE'
        }
      </div>
    </Message.Content>
  </Message>
);

type LeadInfoFromIdProps = {
  leadId: number;
  group: WorkingGroupKeys;
  header?: boolean;
};

export const LeadInfoFromId = ({ leadId, group, header }: LeadInfoFromIdProps) => {
  const transport = useTransport();
  const [lead, error, loading] = usePromise<LeadData | null>(
    () => transport.workingGroups.currentLead(group),
    null,
    [leadId]
  );

  return (
    <PromiseComponent error={error} loading={loading} message="Fetching current lead...">
      <LeadInfo lead={lead} group={group} header={header}/>
    </PromiseComponent>
  );
};
