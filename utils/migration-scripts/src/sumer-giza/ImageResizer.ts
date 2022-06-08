import sharp from 'sharp'
import fs from 'fs'

export const CHANNEL_AVATAR_TARGET_SIZE: [number, number] = [256, 256]
export const VIDEO_THUMB_TARGET_SIZE: [number, number] = [640, 360]
export const CHANNEL_COVER_TARGET_SIZE: [number, number] = [1920, 480]

export class ImageResizer {
  resize(imagePath: string, target: [number, number]): Promise<void> {
    return new Promise((resolve, reject) => {
      const [width, height] = target
      const targetPath = `${imagePath}-resized`
      sharp(imagePath)
        .resize({
          width,
          height,
          fit: 'outside',
        })
        .extract({ left: 0, top: 0, width, height })
        .webp()
        .toFile(targetPath, (err) => {
          if (err) {
            return reject(err)
          }
          fs.renameSync(targetPath, imagePath)
          resolve()
        })
    })
  }
}
