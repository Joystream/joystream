import ContentDirectoryCommandBase from '../../base/ContentDirectoryCommandBase'
import { displayTable } from '../../helpers/display'
import { flags } from '@oclif/command'

export default class EntitiesCommand extends ContentDirectoryCommandBase {
  static description = 'Show entities list by class id or name.'
  static args = [
    {
      name: 'className',
      required: true,
      description: 'Name or ID of the Class',
    },
    {
      name: 'properties',
      required: false,
      description:
        'Comma-separated properties to include in the results table (ie. code,name). ' +
        'By default all property values will be included.',
    },
  ]

  static flags = {
    filters: flags.string({
      required: false,
      description:
        'Comma-separated filters, ie. title="Some video",channelId=3.' +
        'Currently only the = operator is supported.' +
        'When multiple filters are provided, only the entities that match all of them together will be displayed.',
    }),
  }

  async run() {
    const { className, properties } = this.parse(EntitiesCommand).args
    const { filters } = this.parse(EntitiesCommand).flags
    const propsToInclude: string[] | undefined = (properties || undefined) && (properties as string).split(',')
    const filtersArr: [string, string][] = filters
      ? filters
          .split(',')
          .map((f) => f.split('='))
          .map(([pName, pValue]) => [pName, pValue.replace(/^"(.+)"$/, '$1')])
      : []

    displayTable(await this.createEntityList(className, propsToInclude, filtersArr), 3)
  }
}
