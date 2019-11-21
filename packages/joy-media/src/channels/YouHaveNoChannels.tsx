import React from 'react';
import { Button, Message } from 'semantic-ui-react';

type Props = {
  suspended?: boolean
};

export function YouHaveNoChannels (props: Props) {
  const { suspended = false } = props;

  const renderSuspendedAlert = () => (
    <Message
      compact
      error
      icon='warning sign'
      header='Channel Creation Suspended'
      content='Please try again later'
      style={{ display: 'inline-flex', width: 'auto', marginTop: 0 }}
    />
  )

  const renderCreateButton = () => (
    <Button size='big' color='green' style={{ padding: '.75rem 2.25rem' }}>
      <div>Create Channel</div>
      <div style={{ fontSize: '.9rem', paddingTop: '.25rem' }}>
        and start publishing
      </div>
    </Button>
  )

  return <>
    <h3 style={{ marginTop: '2rem', marginBottom: '.5rem' }}>
      Build your following on Joystream
    </h3>
    
    <p style={{ marginBottom: '2rem' }}>
      A channel is a way to organize related content for the benefit 
      of both the publisher and the audience.
    </p>

    {suspended
      ? renderSuspendedAlert()
      : renderCreateButton()
    }
  </>;
}