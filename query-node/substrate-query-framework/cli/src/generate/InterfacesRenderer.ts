import { AbstractRenderer } from './AbstractRenderer';
import { GeneratorContext } from './SourcesGenerator';
import { ObjectType } from '../model';

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

  withInterface(i: ObjectType): GeneratorContext {
    return {}
  }
}