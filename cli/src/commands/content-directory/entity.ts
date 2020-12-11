import ContentDirectoryCommandBase from '../../base/ContentDirectoryCommandBase'
import chalk from 'chalk'
import { displayCollapsedRow, displayHeader } from '../../helpers/display'
import _ from 'lodash'

export default class EntityCommand extends ContentDirectoryCommandBase {
  static description = 'Show Entity details by id.'
  static args = [
    {
      name: 'id',
      required: true,
      description: 'ID of the Entity',
    },
  ]

  async run() {
    const { id } = this.parse(EntityCommand).args
    const entity = await this.getEntity(id, undefined, undefined, false)
    const { controller, frozen, referenceable } = entity.entity_permissions
    const [classId, entityClass] = await this.classEntryByNameOrId(entity.class_id.toString())
    const propertyValues = this.parseEntityPropertyValues(entity, entityClass)

    displayCollapsedRow({
      'ID': id,
      'Class name': entityClass.name.toString(),
      'Class ID': classId.toNumber(),
      'Supported schemas': JSON.stringify(entity.supported_schemas.toJSON()),
      'Controller': controller.type + (controller.isOfType('Member') ? `(${controller.asType('Member')})` : ''),
      'Frozen': frozen.toString(),
      'Refrecencable': referenceable.toString(),
      'Same owner references': entity.reference_counter.same_owner.toNumber(),
      'Total references': entity.reference_counter.total.toNumber(),
    })
    displayHeader('Property values')
    displayCollapsedRow(
      _.mapValues(
        propertyValues,
        (v) =>
          (v.value === null ? chalk.grey('[not set]') : v.value.toString()) +
          ` ${chalk.green(`${v.type}<${v.subtype}>`)}`
      )
    )
  }
}
