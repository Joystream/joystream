import 'reflect-metadata';
import { Type } from 'class-transformer';

export class Input {
  name!: string;

  @Type(() => Field)
  fields!: [Field];
}

export class Field {
  name!: string;
  type!: string;
  description?: string;
}
