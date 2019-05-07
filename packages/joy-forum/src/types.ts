import { getTypeRegistry } from '@polkadot/types';

export function registerForumTypes () {
  try {
    getTypeRegistry().register({
      // TODO add custom types of forum module.
    });
  } catch (err) {
    console.error('Failed to register custom types of forum module', err);
  }
}
