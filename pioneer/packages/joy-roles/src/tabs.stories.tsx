import React from 'react';
import { withKnobs } from '@storybook/addon-knobs';
import { Container, Tab } from 'semantic-ui-react';
import { ContentCuratorsSection } from './tabs/WorkingGroup.stories';
import { OpportunitySandbox } from './tabs/Opportunities.stories';
import { ApplicationSandbox } from './flows/apply.stories';
import { MyRolesSandbox } from './tabs/MyRoles.stories';

export default {
  title: 'Roles / Pages',
  decorators: [withKnobs]
};

export const RolesPage = () => {
  const tab = (
    <Container>
      <Container className="outer">
        <ContentCuratorsSection />
      </Container>
    </Container>
  );

  const renderWorkingGroups = () => tab;
  const renderOpportunitySandbox = () => <OpportunitySandbox />;
  const renderMyRolesSandbox = () => <MyRolesSandbox />;

  const panes = [
    { menuItem: 'Working groups', render: renderWorkingGroups },
    { menuItem: 'Opportunities', render: renderOpportunitySandbox },
    { menuItem: 'My roles and applications', render: renderMyRolesSandbox }
  ];

  return (
    <Tab menu={{ secondary: true, pointing: true }}
      panes={panes}
      defaultActiveIndex={0}
    />
  );
};

export const ApplicationLightbox = ApplicationSandbox;
