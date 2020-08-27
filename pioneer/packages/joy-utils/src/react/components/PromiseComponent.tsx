import React from 'react';
import { Container, Message, Loader } from 'semantic-ui-react';

type ErrorProps = {
  error: string | null;
};

export function Error ({ error }: ErrorProps) {
  console.error(error);

  return (
    <Container style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
      <Message negative>
        <Message.Header>Oops! We got an error!</Message.Header>
        <p>{error}</p>
      </Message>
    </Container>
  );
}

type LoadingProps = {
  text: string;
  inline?: boolean;
};

export function Loading ({ text, inline }: LoadingProps) {
  return (
    inline
      ? <Loader active inline size='small'>{text}</Loader>
      : (
        <Container style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <Loader active inline>{text}</Loader>
        </Container>
      )
  );
}

type PromiseComponentProps = {
  loading: boolean;
  error: string | null;
  message: string;
  inline?: boolean;
}

const PromiseComponent: React.FunctionComponent<PromiseComponentProps> = ({ loading, error, message, children, inline }) => {
  if (loading && !error) {
    return <Loading text={ message } inline={inline}/>;
  } else if (error) {
    return <Error error={error} />;
  }

  return <>{ children }</>;
};

export default PromiseComponent;
