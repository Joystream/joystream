import React, { useState, useEffect } from 'react';

import { Controller, componentName } from '../helpers';

export type ParamsMap = Map<string, string | undefined>

type ViewRendererProps<C> = {
  params?: Record<string, string | undefined>;
  controller: C;
}

export type RenderComponentProps<C, S> = {
  state: S,
  controller: C,
  params: ParamsMap
}
type RenderComponent<C, S> = React.ComponentType<RenderComponentProps<C, S>>

export type ViewRenderer<C> = React.FC<ViewRendererProps<C>>

type ViewArgsExplicit<C, S> = {
  errorComponent?: React.ComponentType;
  renderComponent: RenderComponent<C, S>;
}

type ViewArgs<C, S> = ViewArgsExplicit<C, S> | RenderComponent<C, S>

function DefaultError () {
  return <p>There has been an error</p>;
}

export function View<C extends Controller<S, any>, S> (args: ViewArgs<C, S>): ViewRenderer<C> {
  let RenderComponent: RenderComponent<C, S>;
  let ErrorComponent: React.ComponentType = DefaultError;

  if (typeof args === 'function') {
    RenderComponent = args;
  } else {
    RenderComponent = args.renderComponent;

    if (typeof args.errorComponent !== 'undefined') {
      ErrorComponent = args.errorComponent;
    }
  }

  const ResultComponent: React.FunctionComponent<ViewRendererProps<C>> = (props) => {
    const { controller } = props;
    const [state, setState] = useState<S>(controller.state);

    const onUpdate = (newState: S) => {
      setState({ ...newState });
    };

    useEffect(() => {
      controller.subscribe(onUpdate);
      controller.refreshState(); // Refresh controller state on View mount

      return () => {
        controller.unsubscribe(onUpdate);
      };
    }, []);

    const params = props.params ? new Map(Object.entries(props.params)) : new Map<string, string | undefined>();

    if (controller.hasError()) {
      return ErrorComponent ? <ErrorComponent /> : null;
    } else {
      return <RenderComponent { ...{ state, controller, params } } />;
    }
  };

  ResultComponent.displayName = `View(${componentName(RenderComponent)})`;

  return ResultComponent;
}
