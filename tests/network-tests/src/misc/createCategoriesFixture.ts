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
  }
}
