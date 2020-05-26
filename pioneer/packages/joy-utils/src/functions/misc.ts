export function includeKeys<T extends { [k: string]: any }>(obj: T, ...allowedKeys: string[]) {
  return Object.keys(obj).filter(objKey => {
    return allowedKeys.reduce(
      (hasAllowed: boolean, allowedKey: string) => hasAllowed || objKey.includes(allowedKey),
      false
    );
  });
}

export function splitOnUpperCase(str: string) {
  return str.split(/(?=[A-Z])/);
}

export function slugify(str: string) {
  return splitOnUpperCase(str)
    .map(w => w.toLowerCase())
    .join("-")
    .trim();
}

export function snakeCaseToCamelCase(str: string) {
  return str
    .split('_')
    .map((w, i) => i ? w[0].toUpperCase() + w.substr(1) : w)
    .join('');
}

export function camelCaseToSnakeCase(str: string) {
  return splitOnUpperCase(str)
    .map(w => w[0].toLocaleLowerCase() + w.substr(1))
    .join('_');
}
