import { IAppMetadata } from '@joystream/metadata-protobuf'

export const appCreationForm: Record<keyof IAppMetadata, string> = {
  description: 'App description?',
  authKey: 'App public auth key?',
  websiteUrl: 'Site URL where user can learn more about the app?',
  useUri: 'App URL?',
  platforms: 'Platforms supported by app? Format eg.: "web,mobile,native"',
  category: 'Categories covered by app? Format eg.: "messaging,adult"',
  oneLiner: 'Tagline for the app?',
  termsOfService: 'Terms of service for the app?',
  bigIcon: 'Big icon blob?',
  mediumIcon: 'Medium icon blob?',
  smallIcon: 'Small icon blob?',
}
