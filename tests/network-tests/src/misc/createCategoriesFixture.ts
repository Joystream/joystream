import { BaseFixture } from '../Fixture'

export class CreateMockCategories extends BaseFixture {
  public async execute(): Promise<void> {
    const categories = [
      'Film & Animation',
      'Autos & Vehicles',
      'Music',
      'Pets & Animals',
      'Sports',
      'Travel & Events',
      'Gaming',
      'People',
      'Comedy',
      'Entertainment',
      'News & Politics',
      'Howto & Style',
      'Education',
      'Science & Technology',
      'Nonprofits & Activism',
    ]

    // use content lead as member to create categories
    // this can be any member though - doesn't need any special privileges
    const contentLead = await this.api.getLeader('contentWorkingGroup')
    const member = contentLead[1].memberId

    await Promise.all(categories.map((name) => this.api.createVideoCategory(member, name)))
  }
}
