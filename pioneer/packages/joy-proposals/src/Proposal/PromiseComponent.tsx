import React from 'react';
import Loading from "./Loading";
import Error from "./Error";

type PromiseComponentProps = {
  loading: boolean,
  error: any,
  message: string,
}
const PromiseComponent: React.FunctionComponent<PromiseComponentProps> = ({ loading, error, message, children }) => {
  if (loading && !error) {
    return <Loading text={ message } />;
  } else if (error) {
    return <Error error={error} />;
  }

  return <>{ children }</>;
}

export default PromiseComponent;
