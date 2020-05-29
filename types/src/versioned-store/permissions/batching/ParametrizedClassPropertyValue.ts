
import { ParametrizedPropertyValue } from './parametrized-property-value';
import { JoyStruct } from '../../../JoyStruct';
import { u16 } from '@polkadot/types';

type IParametrizedClassPropertyValue = {
    in_class_index: u16,
    value: ParametrizedPropertyValue
};

export default class ParametrizedClassPropertyValue extends JoyStruct<IParametrizedClassPropertyValue> {
    constructor (value: IParametrizedClassPropertyValue) {
        super({
            in_class_index: u16,
            value: ParametrizedPropertyValue
        }, value);
    }

    get in_class_index() : u16 {
        return this.getField('in_class_index');
    }

    get value() : ParametrizedPropertyValue {
        return this.getField('value');
    }
}