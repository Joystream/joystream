import { AbstractRenderer } from './AbstractRenderer';
import { GeneratorContext } from './SourcesGenerator';
import { GraphQLInterfaceType } from 'graphql';

export class InterfacesRenderer extends AbstractRenderer {
  transform(): GeneratorContext {
    const interfaces: GeneratorContext[] = [];
    this.model.interfaces.map(i => {
      interfaces.push(this.withInterface(i));
    });
    return {
      interfaces,
    };
  }

  withInterface(i: GraphQLInterfaceType): GeneratorContext {
    return {}
  }
}