export function memoize() {
  return (target: Object, propertyKey: string, descriptor: TypedPropertyDescriptor<any>) => {
    descriptor.value = getNewFunction(descriptor.value)
  }
}

let counter = 0;
function getNewFunction(originalMethod: () => void) {
  const identifier = ++counter;

  return function(this: any, ...args: any[]) {
    const propValName = `__memoized_value_${identifier}`;
    const propMapName = `__memoized_map_${identifier}`;

    let returnedValue: any;

    if (args.length > 0) {

      if (!this.hasOwnProperty(propMapName)) {
        Object.defineProperty(this, propMapName, {
          configurable: false,
          enumerable: false,
          writable: false,
          value: new Map<any, any>()
        });
      }
      const myMap: Map<any, any> = this[propMapName];
      const hashKey = args[0]

      if (myMap.has(hashKey)) {
        returnedValue = myMap.get(hashKey);
      } else {
        returnedValue = originalMethod.apply(this, args as []);
        myMap.set(hashKey, returnedValue);
      }

    } else {

      if (this.hasOwnProperty(propValName)) {
        returnedValue = this[propValName];
      } else {
        returnedValue = originalMethod.apply(this, args as []);
        Object.defineProperty(this, propValName, {
          configurable: false,
          enumerable: false,
          writable: false,
          value: returnedValue
        });
      }
    }

    return returnedValue;
  };
}
