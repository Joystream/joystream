import React, { useState, useEffect } from 'react';

import { Controller } from '../helpers';

export type ParamsMap = Map<string, string | undefined>

type ViewRendererProps<C> = {
  params?: Record<string, string | undefined>;
  controller: C;
}

type RenderComponentProps<C, S> = {
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
  return (props: ViewRendererProps<C>): React.ReactElement | null => {
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

    let RenderComponent: RenderComponent<C, S>;
    let Err: React.ComponentType = DefaultError;

    if (typeof args === 'function') {
      RenderComponent = args;
    } else {
      RenderComponent = args.renderComponent;

      if (typeof args.errorComponent !== 'undefined') {
        Err = args.errorComponent;
      }
    }

    if (controller.hasError()) {
      return Err ? <Err /> : null;
    } else {
      return <RenderComponent { ...{ state, controller, params } } />;
    }
  };
}
