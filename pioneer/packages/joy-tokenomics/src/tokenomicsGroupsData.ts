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
    shortTitle: 'Operations A.',
    title: 'Operations Alpha',
    helpText: 'The current Operations Group Alpha members, and the sum of their projected rewards and stakes.',
    color: '#009688',
    lead: {
      titleCutoff: 1015,
      shortTitle: 'Operations A. Lead',
      title: 'Operations Alpha Lead',
      helpText: 'Current Operations Group Alpha Lead, and their projected reward and stake.',
      color: '#00bcd4'
    }
  },
  {
    groupType: 'operationsBeta' as const,
    titleCutoff: 1050,
    shortTitle: 'Operations B.',
    title: 'Operations Beta',
    helpText: 'The current Operations Group Beta members, and the sum of their projected rewards and stakes.',
    color: '#03a9f4',
    lead: {
      titleCutoff: 1015,
      shortTitle: 'Operations B. Lead',
      title: 'Operations Beta Lead',
      helpText: 'Current Operations Group Beta Lead, and their projected reward and stake.',
      color: '#2196f3'
    }
  },
  {
    groupType: 'operationsGamma' as const,
    titleCutoff: 1050,
    shortTitle: 'Operations G.',
    title: 'Operations Gamma',
    helpText: 'The current Operations Group Gamma members, and the sum of their projected rewards and stakes.',
    color: '#3f51b5',
    lead: {
      titleCutoff: 1015,
      shortTitle: 'Operations G. Lead',
      title: 'Operations Gamma Lead',
      helpText: 'Current Operations Group Gamma Lead, and their projected reward and stake.',
      color: '#673ab7'
    }
  }
];
