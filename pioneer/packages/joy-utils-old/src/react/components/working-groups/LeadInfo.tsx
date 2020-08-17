import React from 'react';
import { WorkerData } from '../../../types/workingGroups';
import { ProfilePreviewFromStruct as MemberPreview } from '../../../MemberProfilePreview';
import { Label, Message } from 'semantic-ui-react';
import { formatBalance } from '@polkadot/util';
import { WorkingGroupKey } from '@joystream/types/common';
import { useTransport, usePromise } from '../../hooks';
import PromiseComponent from '../PromiseComponent';
import { formatReward } from '@polkadot/joy-utils/functions/format';

type LeadInfoProps = {
  lead: WorkerData | null;
  group?: WorkingGroupKey;
  header?: boolean;
  emptyMessage?: string;
};

export const LeadInfo = ({ lead, group, header = false, emptyMessage = 'NONE' }: LeadInfoProps) => (
  <Message>
    <Message.Content>
      { header && <Message.Header>Current {group && `${group} `}Working Group lead:</Message.Header> }
      <div style={{ padding: '0.5rem 0' }}>
        { lead
          ? (
            <MemberPreview profile={lead.profile}>
              <div>
                <Label>Role stake: <b>{ lead.stake ? formatBalance(lead.stake) : 'NONE'}</b></Label>
                <Label>Reward: <b>{ lead.reward ? formatReward(lead.reward) : 'NONE' }</b></Label>
              </div>
            </MemberPreview>
          ) : emptyMessage
        }
      </div>
    </Message.Content>
  </Message>
);

type LeadInfoFromIdProps = {
  leadId: number;
  group: WorkingGroupKey;
};

export const LeadInfoFromId = ({ leadId, group }: LeadInfoFromIdProps) => {
  const transport = useTransport();
  const [lead, error, loading] = usePromise<WorkerData | null>(
    () => transport.workingGroups.groupMemberById(group, leadId),
    null,
    [leadId]
  );

  return (
    <PromiseComponent error={error} loading={loading} message="Fetching current lead...">
      <LeadInfo lead={lead} group={group} header={false} emptyMessage="Leader no longer active!"/>
    </PromiseComponent>
  );
};
