
/** This file is generated based on JSON schema. Do not modify. */

import * as Yup from 'yup';

export const FeaturedContentValidationSchema = Yup.object().shape({
  // No validation rules.
});

export type FeaturedContentType = {
  topVideo?: any
  featuredVideos?: any[]
  featuredAlbums?: any[]
};

export const FeaturedContentClass = {
  topVideo: {
    "name": "Top Video",
    "description": "The video that has the most prominent position(s) on the platform.",
    "type": "Internal",
    "classId": "Video"
  },
  featuredVideos: {
    "name": "Featured Videos",
    "description": "Videos featured in the Video tab.",
    "type": "InternalVec",
    "maxItems": 6,
    "classId": "Video"
  },
  featuredAlbums: {
    "name": "Featured Albums",
    "description": "Music albums featured in the Music tab.",
    "type": "InternalVec",
    "maxItems": 6,
    "classId": "Music Album"
  }
};
