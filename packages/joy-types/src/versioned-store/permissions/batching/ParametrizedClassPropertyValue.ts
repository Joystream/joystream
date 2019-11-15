import PropertyIndex from '../../PropertyIndex';
import { ParametrizedPropertyValue } from './parametrized-property-value';
import { JoyStruct } from '../../../JoyStruct';

type IParametrizedClassPropertyValue = {
    in_class_index: PropertyIndex,
    value: ParametrizedPropertyValue
};

export default class ParametrizedClassPropertyValue extends JoyStruct<IParametrizedClassPropertyValue> {
    constructor (value: IParametrizedClassPropertyValue) {
        super({
            in_class_index: PropertyIndex,
            value: ParametrizedPropertyValue
        }, value);
    }

    // getters..
}