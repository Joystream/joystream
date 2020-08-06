let value = 1;

export function nextEntityId (): number {
  return value;
}

export function newEntityId (): number {
  return value++;
}
