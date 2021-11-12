import { assert } from 'chai'
import { Api } from '../Api'
import { BaseFixture } from '../Fixture'

export class AssignCouncilFixture extends BaseFixture {
  private members: string[]

  public constructor(api: Api, members: string[]) {
    super(api)
    this.members = members
  }

  public async execute(): Promise<void> {
    // Assert no council exists
    if ((await this.api.getCouncil()).length) {
      return this.error(new Error('Council assignment fixture expects no council seats to be filled'))
    }

    await this.api.assignCouncil(this.members)

    // Assert council was set
    const councilSize = (await this.api.getCouncil()).length
    assert.equal(councilSize, this.members.length, 'Not Expected council size after assignment')
  }
}
