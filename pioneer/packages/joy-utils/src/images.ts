export const DEFAULT_THUMBNAIL_URL = 'images/default-thumbnail.png';

// This is a hack to just satisfy TypeScript compiler.
type ImageOnErrorEvent = EventTarget & {
  src: string;
  onerror?: (e: any) => void;
};

export function onImageError (event: React.SyntheticEvent<HTMLImageElement, Event>) {
  const target = event.target as ImageOnErrorEvent;
  // Set onerror callback to undefined to prevent infinite callbacks when image src path fails:
  target.onerror = undefined;
  target.src = DEFAULT_THUMBNAIL_URL;
}
