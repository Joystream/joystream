import { GeneratorContext } from './SourcesGenerator';
import { WarthogModel } from '../model';
import Mustache from 'mustache';
import Debug from 'debug';
import * as prettier from 'prettier';

const debug = Debug('qnode-cli:abstract-renderer');

export abstract class AbstractRenderer {
  protected context: GeneratorContext = {};
  protected model: WarthogModel;

  constructor(model: WarthogModel, context: GeneratorContext = {}) {
    this.context = context;
    this.model = model;
  }

  abstract transform(): GeneratorContext;

  render(mustacheTeplate: string): string {
    const mustacheContext = this.transform();
    debug(`Rendering with context: ${JSON.stringify(mustacheContext, null, 2)}`);

    const rendered = Mustache.render(mustacheTeplate, mustacheContext);
    return prettier.format(rendered, {
      parser: 'typescript',
      singleQuote: true,
    });
  }
}
