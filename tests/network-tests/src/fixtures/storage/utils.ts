import { readFileSync } from 'fs'
import { Utils } from '../../utils'
import { ColossusApi } from '../../../ColossusApi'
import { CreatedChannelData } from './GenerateChannelAssetsFixture'

export type VerifyAssetsInput = {
  api: ColossusApi
  channelIds: number[]
}

export const verifyAssets = async (
  inputs: VerifyAssetsInput[],
  channelsData: CreatedChannelData[],
  retryTime = 10_000,
  maxRetries = 18
): Promise<void> => {
  await Utils.until(
    `assets stored by Colossus nodes match expectations`,
    async () => {
      const verifyAssetsPromises = channelsData.map(async ({ id, avatarPhotoPath, coverPhotoPath, qnData }) => {
        Utils.assert(qnData && qnData.avatarPhoto && qnData.coverPhoto)
        for (const { api: colossusApi, channelIds: expectedChannelIds } of inputs) {
          if (expectedChannelIds.includes(id)) {
            await Promise.all([
              colossusApi.fetchAndVerifyAsset(qnData.coverPhoto.id, readFileSync(coverPhotoPath), 'image/bmp'),
              colossusApi.fetchAndVerifyAsset(qnData.avatarPhoto.id, readFileSync(avatarPhotoPath), 'image/bmp'),
            ])
          } else {
            await Promise.all([
              colossusApi.expectAssetNotFound(qnData.coverPhoto.id),
              colossusApi.expectAssetNotFound(qnData.avatarPhoto.id),
            ])
          }
        }
      })
      await Promise.all(verifyAssetsPromises)
      return true
    },
    retryTime,
    maxRetries
  )
}
