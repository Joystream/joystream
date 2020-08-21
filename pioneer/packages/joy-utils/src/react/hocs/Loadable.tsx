import React from 'react';
import { componentName } from '../helpers';

export function Loadable<P extends {[index: string]: any}>
  (required: string[], Component: React.FC<P>): React.FC<P> {

  const ResultComponent: React.FunctionComponent<P> = (props: P) => {
    if (!props) {
      return <div className="spinner"></div>;
    }

    for (const requirement of required) {
      if (typeof props[requirement] === 'undefined') {
        return <div className="spinner"></div>;
      }
    }
    return <Component {...props} />;
  };
  ResultComponent.displayName = `Loadable(${componentName(Component)})`;

  return ResultComponent;
}
