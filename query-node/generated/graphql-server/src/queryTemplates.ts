import { IQueryTemplate, queryTemplateUtils } from '@apollographql/graphql-playground-react/lib/components/Playground/QueryTemplates/templateUtils'

const exampleDate = `"2018-01-31 23:59"`

export const queryTemplates: IQueryTemplate[] = [
  ...queryTemplateUtils.getOneGetAllTemplates('video', 'videos', 'videos'),
  {
    title: 'Featured videos',
    description: 'Get all featured videos.',
    query: `query {
      ${queryTemplateUtils.descriptionMarker}
      videos(where: { isFeatured_eq: true }) { ${queryTemplateUtils.allPropsMarker} }
    }`,
  }, {
    title: 'All recent videos',
    description: 'Get all videos after created or updated after the given date.',
    query: `query {
      ${queryTemplateUtils.descriptionMarker}
      videos(where: {
        createdAt_gt: ${exampleDate},
        updatedAt_gt: ${exampleDate},
      }) { ${queryTemplateUtils.allPropsMarker} }
    }`,
  },

  ...queryTemplateUtils.getOneGetAllTemplates('video category', 'video categories', 'videoCategories'),
  {
    title: `All videos in category`,
    description: `Get all videos associated with the given video category.`,
    query: `query {
      ${queryTemplateUtils.descriptionMarker}
      videos(where: { categoryId_eq: 1 }) { ${queryTemplateUtils.allPropsMarker} }
    }`,
  },
  ...queryTemplateUtils.getOneGetAllTemplates('channel', 'channels', 'channels'),
  ...queryTemplateUtils.getOneGetAllTemplates('channel category', 'channels categories', 'channelCategories'),

  {
    title: `Channel's videos`,
    description: `Get all videos associated with the given channel.`,
    query: `query {
      ${queryTemplateUtils.descriptionMarker}
      videos(where: { channelId_eq: 1 }) { ${queryTemplateUtils.allPropsMarker} }
    }`,
  },

  ...queryTemplateUtils.getOneGetAllTemplates('asset', 'assets', 'dataObjects'),
  ...queryTemplateUtils.getOneGetAllTemplates('membership', 'memberships', 'memberships'),

  ...queryTemplateUtils.getOneGetAllTemplates('curator group', 'curator groups', 'curatorGroups'),
  ...queryTemplateUtils.getOneGetAllTemplates('worker', 'workers', 'workers'),
].map(queryTemplateUtils.formatQuery)
