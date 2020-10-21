import { Api, WorkingGroups } from '../../Api'
import { createSimpleChannelFixture } from '../../fixtures/contentDirectoryModule'
import { assert } from 'chai'

export default async function initializeContentDirectory(api: Api) {
    await api.initializeContentDirectory()
}