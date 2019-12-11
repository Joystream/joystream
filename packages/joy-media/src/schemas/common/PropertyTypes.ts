abstract class BaseProperty {
  public type: string;
  public name: string;
  public description?: string;
  public required?: boolean = false;
}

export class PrimitiveProperty extends BaseProperty {}

export class VecProperty extends BaseProperty {
  public maxItems: number;
}

export class TextProperty extends BaseProperty {
  public maxTextLength: number;
}

export class TextVecProperty extends BaseProperty {
  public maxItems: number;
  public maxTextLength: number;
}

export class InternalProperty extends BaseProperty {
  public classId: any;
}

export class InternalVecProperty extends BaseProperty {
  public maxItems: number;
  public classId: any;
}
