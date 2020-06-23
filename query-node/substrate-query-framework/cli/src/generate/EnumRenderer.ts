import { AbstractRenderer } from './AbstractRenderer';
import { withEnum } from './enum-context';
import { GeneratorContext } from './SourcesGenerator';

export class EnumRenderer extends AbstractRenderer {
  transform(): GeneratorContext {
    const enums: GeneratorContext[] = [];
    this.model.enums.map(e => {
      enums.push(withEnum(e));
    });
    return {
      enums,
    };
  }

}
