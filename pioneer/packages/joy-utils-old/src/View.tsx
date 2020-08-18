import React, { useState, useEffect, useMemo } from 'react';

import { Controller } from './Controller';

export type Params = Map<string, string>

const newParams = (): Params => {
  return new Map<string, string>();
};

type viewProps = {
  params?: Params;
}

type renderFn<C, S> = (state: S, controller: C, params: Params) => React.ReactElement | null

export type ViewComponent<C, P = any, S = any> = React.FC<viewProps>
export type ViewComponentFactory<C, P = any, S = any> = (controller: C) => React.FC<viewProps>

type ViewPropsExplicit<C, S> = {
  errorComponent?: React.ComponentType;
  render: renderFn<C, S>;
}

type ViewProps<C, S> = ViewPropsExplicit<C, S> | renderFn<C, S>

function DefaultError () {
  return <p>There has been an error</p>;
}

export function View<C extends Controller<S, any>, S> (args: ViewProps<C, S>): ViewComponentFactory<C, S> {
  return (controller: C) => {
    return (props: viewProps, ctx: any): React.ReactElement | null => {
      const [state, setState] = useState<S>(controller.state);

      const onUpdate = (newState: S) => {
        setState({ ...newState });
      };

      useEffect(() => {
        controller.subscribe(onUpdate);
        controller.dispatch(); // Dispatch on first subscription (in case there's was a re-render of the View)

        return () => {
          controller.unsubscribe(onUpdate);
        };
      }, []);

      let context: Params;
      if (typeof props.params !== 'undefined') {
        context = props.params;
      } else {
        context = newParams();
      }

      let renderFn: renderFn<C, S>;
      let Err: React.ComponentType = DefaultError;
      if (typeof args === 'function') {
        renderFn = args;
      } else {
        renderFn = args.render;

        if (typeof args.errorComponent !== 'undefined') {
          Err = args.errorComponent;
        }
      }

      return useMemo(() => {
        if (controller.hasError()) {
          return Err ? <Err /> : null;
        }
        return renderFn(state, controller, context);
      }, [state]);
    };
  };
}
