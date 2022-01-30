export const NON_WORKING_GROUPS = [
  {
    groupType: 'validators' as const,
    titleCutoff: 1050,
    shortTitle: 'Validators',
    title: 'Validators (Nominators)',
    helpText:
      'The current set of active Validators (and Nominators), and the sum of the sets projected rewards and total stakes (including Nominators).',
    color: '#ff9800'
  },
  {
    groupType: 'council' as const,
    titleCutoff: 1015,
    shortTitle: 'Council',
    title: 'Council Members',
    helpText:
      'The current Council Members, and the sum of their projected rewards and total stakes (including voters/backers).',
    color: '#ffc107'
  }
];

export const WORKING_GROUPS = [
  {
    groupType: 'storageProviders' as const,
    titleCutoff: 1015,
    shortTitle: 'Storage',
    title: 'Storage Providers',
    helpText: 'The current Storage Providers, and the sum of their projected rewards and stakes.',
    color: '#ffeb3b',
    lead: {
      titleCutoff: 1015,
      shortTitle: 'S. Lead',
      title: 'Storage Lead',
      helpText: 'Current Storage Provider Lead, and their projected reward and stake.',
      color: '#cddc39'
    }
  },
  {
    groupType: 'contentCurators' as const,
    titleCutoff: 1015,
    shortTitle: 'Curators',
    title: 'Content Curators',
    helpText: 'The current Content Curators, and the sum of their projected rewards and stakes.',
    color: '#8bc34a',
    lead: {
      titleCutoff: 1015,
      shortTitle: 'C. Lead',
      title: 'Curators Lead',
      helpText: 'Current Content Curators Lead, and their projected reward and stake.',
      color: '#4caf50'
    }
  },
  {
    groupType: 'operationsAlpha' as const,
    titleCutoff: 1050,
    shortTitle: 'Builders',
    title: 'Builders',
    helpText: 'The current Builders, and the sum of their projected rewards and stakes.',
    color: '#009688',
    lead: {
      titleCutoff: 1015,
      shortTitle: 'Builders Lead',
      title: 'Builders Lead',
      helpText: 'Current Builders Lead, and their projected reward and stake.',
      color: '#00bcd4'
    }
  },
  {
    groupType: 'operationsBeta' as const,
    titleCutoff: 1050,
    shortTitle: 'Human Res.',
    title: 'Human Resources',
    helpText: 'The current Human Resources Workers, and the sum of their projected rewards and stakes.',
    color: '#03a9f4',
    lead: {
      titleCutoff: 1015,
      shortTitle: 'HR Lead',
      title: 'Human Res. Lead',
      helpText: 'Current Human Resources Lead, and their projected reward and stake.',
      color: '#2196f3'
    }
  },
  {
    groupType: 'operationsGamma' as const,
    titleCutoff: 1050,
    shortTitle: 'Marketing',
    title: 'Marketing',
    helpText: 'The current Marketers, and the sum of their projected rewards and stakes.',
    color: '#3f51b5',
    lead: {
      titleCutoff: 1015,
      shortTitle: 'Marketing Lead',
      title: 'Marketing Lead',
      helpText: 'Current Marketing Lead, and their projected reward and stake.',
      color: '#673ab7'
    }
  },
  {
    groupType: 'distribution' as const,
    titleCutoff: 1050,
    shortTitle: 'Distribution',
    title: 'Distribution',
    helpText: 'The current Distribution Group members, and the sum of their projected rewards and stakes.',
    color: '#9c27b0',
    lead: {
      titleCutoff: 1015,
      shortTitle: 'Distr. Lead',
      title: 'Distribution Lead',
      helpText: 'Current Distribution Group Lead, and their projected reward and stake.',
      color: '#e91e63'
    }
  }
];
