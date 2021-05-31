import React from 'react';
import styled from 'styled-components';

import { I18nProps } from '@polkadot/react-components/types';
import _ from 'lodash';

import { RouteProps as AppMainRouteProps } from '@polkadot/apps-routing/types';
import translate from './translate';
import { Button, Grid, Message, Icon, Image } from 'semantic-ui-react';

import AtlasScreenShot from './assets/atlas-screenshot.jpg';
import JoystreamStudio from './assets/joystream-studio-screenshot.png';

const MediaMain = styled.main`
  display: flex;
  flex-direction: column;
  align-items: center;
  padding-top: 2em;
  font-size: 1.2em;
  p {
    margin: 0.25em;
    padding: 0;
  }
`;

const Header = styled.header`
  margin-bottom: 1em;
  h1 {
    color: #222 !important;
  }
`;

const StyledMessage = styled(Message)`
  font-size: 1.2em;
  display: flex;
  flex-direction: column;
  background: #fff !important;
  .header, .content {
    margin-bottom: 0.5em !important;
  }
  .button {
    margin-top: auto;
    margin-right: auto !important;
  }
`;

const Screenshot = styled(Image)`
  margin: 0.5em 0;
  transition: opacity 0.5s;
  :hover { opacity: 0.7; }
`;

const StyledList = styled(Message.List)`
  margin-top: 0.5em !important;
`;

interface Props extends AppMainRouteProps, I18nProps {}

const App: React.FC<Props> = () => {
  return (
    <MediaMain>
      <Header>
        <h1>Hello there!</h1>
        <p>
          We have now upgraded to the Sumer chain.
        </p>
        <p>
          Pioneer <b>no longer supports</b> media uploads and consumption.
        </p>
      </Header>
      <Grid stackable>
        <Grid.Row columns={2}>
          <Grid.Column>
            <StyledMessage>
              <Message.Header>Media consumption</Message.Header>
              <Message.Content>
                Media consumption has been migrated over to our new consumer interface.
                <Screenshot
                  src={AtlasScreenShot as string}
                  href='https://play.joystream.org'
                  target='_blank'
                  rel='noopener noreferrer'/>
              </Message.Content>
              <Button
                size='big'
                primary
                icon
                labelPosition='right'
                href='https://play.joystream.org'
                target='_blank'
                rel='noopener noreferrer'>
                Launch Atlas
                <Icon name='arrow right' />
              </Button>
            </StyledMessage>
          </Grid.Column>
          <Grid.Column>
            <StyledMessage>
              <Message.Header>Uploading content</Message.Header>
              <Message.Content>
                With Sumer, the content uploading process has been streamlined and made accessible through Joystream Studio. To upload a video:
                <StyledList>
                  <Message.Item>Go to Joystream Studio</Message.Item>
                  <Message.Item>Upload video and thumbnail</Message.Item>
                  <Message.Item>Fill out the associated metadata</Message.Item>
                  <Message.Item>Publish</Message.Item>
                </StyledList>
                <Screenshot
                  src={JoystreamStudio as string}
                  href='https://play.joystream.org'
                  target='_blank'
                  rel='noopener noreferrer'/>
              </Message.Content>
              <Button
                size='big'
                primary
                href='https://play.joystream.org/studio'
                icon
                labelPosition='right'
                target='_blank'
                rel='noopener noreferrer'>
                Explore Joystream Studio
                <Icon name='arrow right' />
              </Button>
            </StyledMessage>
          </Grid.Column>
        </Grid.Row>
      </Grid>
    </MediaMain>
  );
};

export default translate(App);
