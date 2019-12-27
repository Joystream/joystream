import React from 'react';
import { ITransport } from './transport';
import { RouteComponentProps } from 'react-router';

export type MediaViewProps<P = {}> = {
  transport: ITransport
  routeProps?: RouteComponentProps
  initialProps?: Partial<P>
};

export abstract class MediaView<P = {}> {

  protected Component: React.ComponentType<P>
  protected transport: ITransport
  protected routeProps?: RouteComponentProps
  protected initialProps?: Partial<P>

  constructor (Component: React.ComponentType<P>, props: MediaViewProps<P>) {
    this.Component = Component;
    this.transport = props.transport;
    this.routeProps = props.routeProps;
    this.initialProps = props.initialProps;
  }

  public abstract async resolveProps (): Promise<Partial<P>>

  public render (): React.ReactElement | null {
    const resolvedProps = await this.resolveProps();
    const props = {
      ...this.initialProps,
      ...resolvedProps
    } as P;
    return <this.Component {...props} />;
  }
}
