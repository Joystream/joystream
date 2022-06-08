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
      'People & Blogs',
      'Comedy',
      'Entertainment',
      'News & Politics',
      'Howto & Style',
      'Education',
      'Science & Technology',
      'Nonprofits & Activism',
    ]

    await Promise.all(categories.map((name) => this.api.createChannelCategoryAsLead(name)))

    await Promise.all(categories.map((name) => this.api.createVideoCategoryAsLead(name)))
  }
}
