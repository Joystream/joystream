import React from 'react';
import { Message } from 'semantic-ui-react';
import { nonEmptyStr } from '.';

type BaseProps = {
  title?: React.ReactNode;
  children?: React.ReactNode;
}

type Variants = {
  info?: boolean;
  success?: boolean;
  warning?: boolean;
  error?: boolean;
}

type Props = BaseProps & Variants

export const JoyStatus = (props: Props) => {
  const { title, children, ...variants } = props;

  return (
    <Message className='JoyMainStatus' {...variants}>
      {nonEmptyStr(title) &&
        <Message.Header>{title}</Message.Header>
      }
      {children &&
        <div style={{ marginTop: '1rem' }}>
          {children}
        </div>
      }
    </Message>
  );
};

export const JoyInfo = (props: BaseProps) => <JoyStatus {...props} info />;

export const JoySuccess = (props: BaseProps) => <JoyStatus {...props} success />;

export const JoyWarn = (props: BaseProps) => <JoyStatus {...props} warning />;

export const JoyError = (props: BaseProps) => <JoyStatus {...props} error />;
