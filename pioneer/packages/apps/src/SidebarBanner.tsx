import React, { useState, useEffect } from 'react';
import usePromise from '@polkadot/joy-utils/react/hooks/usePromise';
import styled from 'styled-components';
import { Segment, Loader, Button } from 'semantic-ui-react';

const COUNTER_BORDER_RADIUS_VALUE = 2;

const BannerContainer = styled.div<{ isCollapsed?: boolean }>`
  ${({ isCollapsed }) => isCollapsed ? `
    min-height: 222px;
    max-height: 222px;
  ` : `
    min-height: 322px;
    max-height: 322px;
    padding: 16px;
  `}
  width: 100%;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  background-color: #4038FF;
`;

const BannerTitle = styled.h1`
  padding-right: 1px;
  font-family: Lato;
  font-size: 16px;
  font-weight: 800;
  line-height: 20px;
  letter-spacing: 0em;
  color: white;
`;

const BannerSubtitle = styled.h2`
  margin-top: 16px;
  font-family: Lato;
  font-size: 14px;
  font-weight: 400;
  line-height: 18px;
  letter-spacing: 0em;
  color: #E0E1FF;
`;

const BannerLink = styled.a`
  margin-top: 8px;
  font-size: 12px;
  font-weight: 600;
  line-height: 16px;
  letter-spacing: 0em;
  text-align: center;
  text-decoration: underline;
  color: #B4BBFF !important;
`;

const BannerButton = styled(Button)`
  width: 100% !important;
  margin-top: 8px !important;
`;

const ProgressContainer = styled.div<{ isCollapsed ?: boolean }>`
  width: 100%;
  ${({ isCollapsed }) => isCollapsed ? `
    margin-top: 3px;
  ` : `
    margin-top: 8px;
  `}
`;

const CounterContainer = styled.div<{ isCollapsed ?: boolean }>`
  width: 100%;
  ${({ isCollapsed }) => isCollapsed ? `
    height: 120px;
    flex-direction: column;
  ` : `
    height: 64px;
  `}
  padding: 8px;
  display: flex;
  align-items: center;
  justify-content: ${({ children }) => children && children > 1 ? 'space-between' : 'center'};
  background-color: #261EE4;
  border-top-left-radius: ${COUNTER_BORDER_RADIUS_VALUE}px;
  border-top-right-radius: ${COUNTER_BORDER_RADIUS_VALUE}px;
`;

const CounterItem = styled.div<{ isCollapsed ?: boolean }>`
  ${({ isCollapsed }) => isCollapsed ? `
    width: 43px;
  ` : `
    width: 56px;
  `}
  height: 48px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: space-between;
`;

const CounterItemNumber = styled.p`
  margin: 0;
  font-size: 32px;
  font-weight: 700;
  line-height: 32px;
  letter-spacing: 0em;
  color: white;
`;

const CounterItemText = styled.p`
  margin: 0;
  font-size: 10px;
  font-weight: 600;
  line-height: 16px;
  letter-spacing: 0em;
  color: white;
`;

const Progress = styled.div<{ isCollapsed?: boolean }>`
  width: 100%;
  height: 6px;
  background-color: #5252FF;
  ${({ isCollapsed }) => !isCollapsed && `
    border-bottom-left-radius: ${COUNTER_BORDER_RADIUS_VALUE}px;
    border-bottom-right-radius: ${COUNTER_BORDER_RADIUS_VALUE}px;
  `}
`;

const ProgressBar = styled.div<{ isCollapsed?: boolean }>`
  width: 0%;
  height: 100%;
  background-color: white;
  ${({ isCollapsed }) => !isCollapsed && `
    border-bottom-left-radius: ${COUNTER_BORDER_RADIUS_VALUE}px;
    border-bottom-right-radius: ${COUNTER_BORDER_RADIUS_VALUE}px;
  `}
`;

const ErrorText = styled.h1`
  font-size: 14px;
  letter-spacing: 0em;
  font-weight: 600;
  color: white;
`;

const DatesContainer = styled.div`
  width: 100%;
  display: flex;
  justify-content: space-between;
  margin-top: 8px;
`;

const DateText = styled.p<{ isCollapsed?: boolean }>`
  font-size: 12px;
  line-height: 16px;
  letter-spacing: 0em;
  color: #E0E1FF;
  ${({ isCollapsed }) => isCollapsed && `
    margin-top: 8px;
  `}
`;

const StyledLoader = styled(Loader)`
  ::before {
    border-color: rgba(255,255,255,.15) !important;
  }

  ::after {
    border-color: white transparent transparent !important;
  }
`;

const FM_DATA_URL = 'https://raw.githubusercontent.com/Joystream/founding-members/main/data/fm-info.json';
const MILLISECONDS_TO_DAYS = 1000 * 60 * 60 * 24;

type FoundingMembersData = {
  scoringPeriodsFull: {
    currentScoringPeriod: {
      started: string;
      ends: string;
    }
  }
}

const numberToDateString = (number: number) => {
  const remainingTime: Array<[number, string]> = [];

  const weeks = Math.floor(number / 7);
  const days = Math.floor(number - (weeks * 7));
  const hours = Math.floor((number - ((weeks * 7) + days)) * 24);

  if (weeks) {
    remainingTime.push([weeks, weeks === 1 ? 'WEEK' : 'WEEKS']);

    if (days) {
      remainingTime.push([days, days === 1 ? 'DAY' : 'DAYS']);
    }

    return remainingTime;
  }

  if (days) {
    remainingTime.push([days, days === 1 ? 'DAY' : 'DAYS']);
  }

  if (hours) {
    remainingTime.push([hours, hours === 1 ? 'HOUR' : 'HOURS']);
  }

  return remainingTime;
};

const SidebarBanner = ({ isSidebarCollapsed } : { isSidebarCollapsed: boolean}) => {
  const [foundingMembersData, foundingMembersDataError] = usePromise<FoundingMembersData | undefined>(
    () => fetch(FM_DATA_URL).then((res) => res.json().then((data) => data as FoundingMembersData)), undefined, []
  );
  const [dates, setDates] = useState<{ started: Date, ends: Date }>();
  const [progress, setProgress] = useState<number>(0);
  const [remainingTime, setRemainingTime] = useState<number>();

  useEffect(() => {
    if (foundingMembersData && !foundingMembersDataError) {
      const scoringPeriodStartedDate = new Date(foundingMembersData.scoringPeriodsFull.currentScoringPeriod.started);
      const scoringPeriodEndedDate = new Date(foundingMembersData.scoringPeriodsFull.currentScoringPeriod.ends);
      const now = new Date();

      // calculate the elapsed time from start of scoring period until now
      const timeDifferenceBetweenDates = Math.abs(scoringPeriodEndedDate.getTime() - scoringPeriodStartedDate.getTime()) / MILLISECONDS_TO_DAYS;
      const timePassedUntilNow = Math.abs(now.getTime() - scoringPeriodStartedDate.getTime()) / MILLISECONDS_TO_DAYS;
      const progressPercentage = (timePassedUntilNow / timeDifferenceBetweenDates) * 100;

      // calculate the amount of days remaining until the end of the scoring period
      const remainingTime = Math.abs(scoringPeriodEndedDate.getTime() - now.getTime()) / MILLISECONDS_TO_DAYS;

      setRemainingTime(remainingTime);

      setDates({
        started: scoringPeriodStartedDate,
        ends: scoringPeriodEndedDate
      });

      setProgress(progressPercentage > 100 ? 100 : progressPercentage);
    }
  }, [foundingMembersData]);

  const Loading = ({ isCollapsed } : { isCollapsed ?: boolean}) => (
    <Segment>
      <StyledLoader active size={isCollapsed ? 'small' : 'medium'} />
    </Segment>
  );

  const Error = () => (
    <ErrorText> Error.. </ErrorText>
  );

  if (isSidebarCollapsed) {
    return (
      <BannerContainer isCollapsed={true}>
        <BannerSubtitle>Scoring period ends in:</BannerSubtitle>
        <ProgressContainer isCollapsed={true}>
          <CounterContainer isCollapsed={true}>
            {remainingTime
              ? numberToDateString(remainingTime).map(([amountOfTime, timePeriodString], index) => (
                <CounterItem key={`${index}-${amountOfTime}-${timePeriodString}`}>
                  <CounterItemNumber>{amountOfTime}</CounterItemNumber>
                  <CounterItemText>{timePeriodString}</CounterItemText>
                </CounterItem>
              ))
              : <Loading isCollapsed={true}/>
            }
            {!remainingTime && foundingMembersDataError ? <Error /> : null}
          </CounterContainer>
          <Progress isCollapsed={true}>
            <ProgressBar isCollapsed={true} style={{ width: `${progress}%` }}/>
          </Progress>
        </ProgressContainer>
        <DateText isCollapsed={true} >{dates?.ends.toLocaleString('default', { month: 'short' })} {dates?.ends.getDate()}</DateText>
      </BannerContainer>
    );
  }

  return (
    <BannerContainer>
      <BannerTitle>Report your activity to earn FM points</BannerTitle>
      <BannerSubtitle>Current scoring period ends in:</BannerSubtitle>
      <ProgressContainer>
        <CounterContainer>
          {remainingTime
            ? numberToDateString(remainingTime).map(([amountOfTime, timePeriodString], index) => (
              <CounterItem key={`${index}-${amountOfTime}-${timePeriodString}`}>
                <CounterItemNumber>{amountOfTime}</CounterItemNumber>
                <CounterItemText>{timePeriodString}</CounterItemText>
              </CounterItem>
            ))
            : <Loading />
          }
          {!remainingTime && foundingMembersDataError ? <Error /> : null}
        </CounterContainer>
        <Progress>
          <ProgressBar style={{ width: `${progress}%` }}/>
        </Progress>
        <DatesContainer>
          <DateText>{dates?.started.toLocaleString('default', { month: 'short' })} {dates?.started.getDate()}</DateText>
          <DateText>{dates?.ends.toLocaleString('default', { month: 'short' })} {dates?.ends.getDate()}</DateText>
        </DatesContainer>
      </ProgressContainer>
      <BannerButton
        color='black'
        href='https://www.joystream.org/founding-members/form/'
        target='_blank'
        rel='noopener noreferrer'
      >
        Report now
      </BannerButton>
      <BannerLink
        href='https://github.com/Joystream/founding-members/blob/main/SUBMISSION-GUIDELINES.md'
        target='_blank'
        rel='noopener noreferrer'
      >
        Learn more...
      </BannerLink>
    </BannerContainer>
  );
};

export default SidebarBanner;
