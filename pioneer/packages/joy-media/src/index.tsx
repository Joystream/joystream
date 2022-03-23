import React from 'react';
import styled from 'styled-components';

import { I18nProps } from '@polkadot/react-components/types';
import _ from 'lodash';

import { RouteProps as AppMainRouteProps } from '@polkadot/apps-routing/types';
import translate from './translate';
import { Button, Grid, Message, Icon, Image } from 'semantic-ui-react';

import AtlasScreenShot from './assets/atlas-screenshot.jpg';
import JoystreamStudio from './assets/joystream-studio-screenshot.png';
import PioneerScreenShot from './assets/pioneer-screenshot.png';

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
  max-width: 86rem;
`;

const ListParagraph = styled.p`
  margin-top: 1rem !important;
  span {
    margin-bottom: 0.2rem;
  }
  ol {
    margin-top: 0.3rem;
    list-style-position: inside;
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
        We have just upgraded to our new Olympia Chain. That means our clunky user interface has been replaced,
        and all the action will happen on <a target='_blank' rel='noopener noreferrer' href='https://dao.joystream.org'>dao.joystream.org</a>.
        Be warned that as a new product, there will be bugs! If you are stuck - reach out on our{' '}
          <a target='_blank' rel='noopener noreferrer' href='https://discord.gg/DE9UN3YpRP'>Discord</a> and we&apos;ll guide you through the process :)
        </p>
        <ListParagraph>
          <span>We have kept this stripped down version intact for two reasons:</span>
          <ol>
            <li>
              As the new pioneer doesn&apos;t store keys, you need to copy all your keys over to the{' '}
              <a target='_blank' rel='noopener noreferrer' href='https://polkadot.js.org/extension/'>polkadot-js extension</a>.
            </li>
            <li>If you want to be a Validator on Olympia, you will have to do it here for now!</li>
          </ol>
        </ListParagraph>
      </Header>
      <Grid stackable>
        <Grid.Row columns={2}>
          <Grid.Column>
            <StyledMessage>
              <Message.Header>Pioneer</Message.Header>
              <Message.Content>
                This website has been replaced by the new state-of-the-art Pioneer v2. Check it out!
                <Screenshot
                  src={PioneerScreenShot as string}
                  href='https://dao.joystream.org'
                  target='_blank'
                  rel='noopener noreferrer'/>
              </Message.Content>
              <Button
                size='big'
                primary
                icon
                labelPosition='right'
                href='https://dao.joystream.org'
                target='_blank'
                rel='noopener noreferrer'>
                Launch Pioneer
                <Icon name='arrow right' />
              </Button>
            </StyledMessage>
          </Grid.Column>
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
                  <Message.Item>Create/connect your membership</Message.Item>
                  <Message.Item>Create a channel</Message.Item>
                  <Message.Item>Publish content</Message.Item>
                </StyledList>
                <Screenshot
                  src={JoystreamStudio as string}
                  href='https://play.joystream.org/studio'
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
