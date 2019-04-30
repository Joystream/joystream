export const DEFAULT_THUMBNAIL_URL = 'images/default-thumbnail.png';

export function fileNameWoExt (fileName: string): string {
  const lastDotIdx = fileName.lastIndexOf('.');
  return fileName.substring(0, lastDotIdx);
}
