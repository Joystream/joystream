import React from 'react';
import styled from 'styled-components';
import { Button, Icon } from 'semantic-ui-react';
import CoinIllustration from '../../assets/coin-illustration.png';
import CoinIllustrationSmall from '../../assets/coin-illustration1.png';

const FM_SUBMISSION_GUIDELINES_LINK = 'https://github.com/Joystream/founding-members/blob/main/SUBMISSION-GUIDELINES.md';

const Container = styled.div`
  height: auto;
  margin: 2em 0 0 0;
  display: flex;
  justify-content: center;
  align-items: center;
`;

const Banner = styled.div`
  height: 89px;
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1.5em;
  background-color: #262626;
  box-shadow: inset 0px 0px 0px 1px rgba(34, 36, 38, 0.22);
  border-radius: 4px;
  background-image: url(${CoinIllustration});
  background-position: 90% 0;
  background-repeat: no-repeat;
  background-size: contain;

  @media(max-width: 1450px){
    height: 109px;
  }

  @media(max-width: 1200px){
    background-image: none;
  }

  @media(max-width: 800px){
    flex-direction: column;
    align-items: initial;
    height: auto;
  }

  @media (max-width: 425px){
    background-image: url(${CoinIllustrationSmall});
    padding-top: 7em;
    background-position: left 0;
    background-size: 200px;
  }
`;

const TextContainer = styled.div``;

const BannerTitle = styled.h1`
  font-family: Lato;
  font-size: 16px;
  font-style: normal;
  font-weight: 900;
  line-height: 20px;
  letter-spacing: 0em;
  color: white;
  margin-bottom: 7px;
`;

const BannerText = styled.p`
  font-size: 14px;
  font-style: normal;
  font-weight: 400;
  line-height: 20px;
  letter-spacing: 0.0033em;
  color: #FFFFFFDE;

  a {
    text-decoration: underline;
    color: inherit;
  }
`;

const LinkWrapper = styled.a`
  margin-left: 260px;

  @media(max-width: 1200px){
    margin-left: 30px;  
  }

  @media(max-width: 800px){
    margin: 20px 0 0 0;
  }
`;

const BannerButton = styled(Button)`
  background-color: #4038FF !important;
  color: white !important;
  width: 155px !important;
  height: 36px !important;

  .icon {
    background-color: #3D35F2 !important;
  }
`;

interface Props {
  contextualTitle: 'Council' | 'Working Groups' | 'Proposals' | 'Forum';
}

const FMReminderBanner = ({ contextualTitle } : Props) => {
  return (
    <Container>
      <Banner>
        <TextContainer>
          <BannerTitle>Report your {contextualTitle} activity to earn Founding Members points!</BannerTitle>
          <BannerText>Only activity that&apos;s been reported is eligible for earning FM points. <a href={FM_SUBMISSION_GUIDELINES_LINK}>Learn more about reporting your activity...</a></BannerText>
        </TextContainer>
        <LinkWrapper href='https://www.joystream.org/founding-members/form/'>
          <BannerButton icon labelPosition='right'>
              Report Now
            <Icon name='arrow right' />
          </BannerButton>
        </LinkWrapper>
      </Banner>
    </Container>
  );
};

export default FMReminderBanner;
