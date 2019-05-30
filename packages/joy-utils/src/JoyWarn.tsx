import React from 'react';
import { Message } from 'semantic-ui-react';

type Props = {
  title: React.ReactNode
  children?: React.ReactNode
};

export const JoyWarn = ({ title, children }: Props) => (
  <Message warning className='JoyMainStatus'>
    <Message.Header>{title}</Message.Header>
    {children && <div style={{ marginTop: '1rem' }}>
      {children}
    </div>}
  </Message>
);
