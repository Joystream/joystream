import React from 'react';

export function componentName (WrappedComponent: React.ComponentType<any>) {
  return WrappedComponent.displayName || WrappedComponent.name || 'Component';
}

export { Controller } from './Controller';
export { Observable } from './Observable';
export { Subscribable } from './Subscribable';
