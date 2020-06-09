import React from 'react';
import { Link } from 'react-router-dom';
import { Message } from 'semantic-ui-react';

type Props = {
  suspended?: boolean;
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
      className='JoyInlineMsg'
    />
  );

  const renderCreateButton = () => (
    <Link to={'/media/channels/new'}>
      <Message
        compact
        success
        icon='plus circle'
        header='Create Channel'
        content='and start publishing'
        className='JoyInlineMsg CreateBtn'
      />
    </Link>
  );

  return <>
    <h2 style={{ marginTop: '2rem', marginBottom: '.5rem' }}>
      Build your following on Joystream
    </h2>

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
