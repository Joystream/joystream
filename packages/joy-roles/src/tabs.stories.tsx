import React from 'react'
import { withKnobs } from '@storybook/addon-knobs'
import { Container, Tab } from 'semantic-ui-react';
import { ContentCuratorsSection, StorageProvidersSection } from './tabs/WorkingGroup.stories'
import { OpportunitySandbox } from './tabs/Opportunities.stories'
import { ApplicationSandbox } from './flows/apply.stories'

export default {
  title: 'Roles / Pages',
  decorators: [withKnobs],
}

export const RolesPage = () => {
  const tab = (
    <Container>
      <Container className="outer">
        <ContentCuratorsSection />
      </Container>
      <Container>
        <StorageProvidersSection />
      </Container>
    </Container>
  )

  const panes = [
    { menuItem: 'Working groups', render: () => tab },
    { menuItem: 'Opportunities', render: () => <OpportunitySandbox /> },
    { menuItem: 'My roles', render: () => null },
  ]

  return (
    <Tab menu={{ secondary: true, pointing: true }}
      panes={panes}
      defaultActiveIndex={0}
    />
  )
}

export const ApplicationLightbox = ApplicationSandbox
