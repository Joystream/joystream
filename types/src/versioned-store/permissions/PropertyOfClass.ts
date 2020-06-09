import { JoyStruct } from '../../JoyStruct';
import ClassId from '../ClassId';
import { u16 } from '@polkadot/types';


type IPropertyOfClass = {
    class_id: ClassId,
    property_index: u16
};

export default class PropertyOfClass extends JoyStruct<IPropertyOfClass> {
    constructor (value: IPropertyOfClass) {
        super({
            class_id: ClassId,
            property_index: u16
        }, value);
    }

    get class_id () : ClassId {
        return this.getField('class_id');
    }

    get property_index() : u16 {
        return this.getField('property_index');
    }
}