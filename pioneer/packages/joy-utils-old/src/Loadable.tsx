import React from 'react';

export function Loadable<P extends {[index: string]: any}> (required: string[], f: (props: P) => React.ReactNode | void): (props: P) => any {
  const loading = <div className="spinner"></div>;

  return (props: P) => {
    if (!props) {
      return loading;
    }

    for (const requirement of required) {
      if (typeof props[requirement] === 'undefined') {
        return loading;
      }
    }
    return f(props);
  };
}
