import React from 'react';
import { Container, Message, Loader } from 'semantic-ui-react';

type ErrorProps = {
  error: any;
};

export function Error ({ error }: ErrorProps) {
  console.error(error);
  return (
    <Container style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
      <Message negative>
        <Message.Header>Oops! We got an error!</Message.Header>
        <p>{error.message}</p>
      </Message>
    </Container>
  );
}

type LoadingProps = {
  text: string;
};

export function Loading ({ text }: LoadingProps) {
  return (
    <Container style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
      <Loader active inline>{text}</Loader>
    </Container>
  );
}

type PromiseComponentProps = {
  loading: boolean;
  error: any;
  message: string;
}
const PromiseComponent: React.FunctionComponent<PromiseComponentProps> = ({ loading, error, message, children }) => {
  if (loading && !error) {
    return <Loading text={ message }/>;
  } else if (error) {
    return <Error error={error} />;
  }

  return <>{ children }</>;
};

export default PromiseComponent;
