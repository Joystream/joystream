import { newEntityId } from './EntityId.mock';
import { MediaObjectType } from '../schemas/general/MediaObject';

const values = [
  '5Gm2XPvDm1RhYW2CEbVvrMbRFguL4TMmzP3tm72wvhCZdx5G',
  '5GTGqmWTurJhYY5UoHzFrAqAxL5ry4Jegw9pmjKniQ3KWWww',
  '5CbyRopmCNwLYyRCwHrmovoQ15MMCau9v9cmazbWuQjY9DG2',
  '5GTXWLWgfCM6GpsBkeJQZvF6RFvZh3SjCsH8aGUY1WwV5YGU',
  '5CSBeDZR5baBcnLYZsP839P1uqZKfz3D9Uip43uvhUd56XAq',
  '5EXsnf4sS6wVsgjqQmT2jchP2LdGXLxZZSJijjTiUxcLm7Vg',
  '5HRieqw8oRZfwc6paio4TrBeYvmdTstGB2KoKE9gL5qLnAQY'
];

export const AllMediaObjects: MediaObjectType[] =
  values.map(value => ({ id: newEntityId(), value })) as unknown as MediaObjectType[]; // A hack to fix TS compilation.

export const MediaObject = AllMediaObjects[0];
