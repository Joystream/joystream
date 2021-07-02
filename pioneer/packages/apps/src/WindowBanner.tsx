import React, { useState, useEffect } from 'react';
import usePromise from '@polkadot/joy-utils/react/hooks/usePromise';
import styled from 'styled-components';
import { Loader, Progress, Dimmer } from 'semantic-ui-react';

const WindowBannerContainer = styled.div`
    height: 125px;
    width: 100%;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    background-color: black;
    position: absolute;
    bottom: 0;
    z-index: 9999;
`;

const CounterText = styled.h1`
    font-size: 32px;
    text-align: center;
    color: white;
    margin-bottom: 0px;

    @media(max-width: 1300px){
      font-size: 26px;
    }
`;

const BannerText = styled.p`
    font-size: 20px;
    text-align: center;
    color: white;
    margin-bottom: 10px;

    @media(max-width: 1300px){
        font-size: 16px;
        margin-bottom: 8px;
    }

    @media(max-width: 1000px){
      width: 75%;
    }
`;

const ErrorText = styled.h1`
    font-size: 26px;
    text-align: center;
    color: white;
`;

const ProgressContainer = styled.div`
    width: 50%;
`;

const DatesContainer = styled.div`
    width: 100%;
    display: flex;
    justify-content: space-between;
`;

const DateText = styled.p`
    font-size: 15px;
    letter-spacing: -.4000000059604645px;
    color: #dfe4ea;
    margin-bottom: 0;
`;

const StyledProgress = styled(Progress)`
    width: 100%;
    height: 8px;
    background-color: #4038ff !important;
    margin-bottom: 5px !important;

    & > div {
        height: 8px !important;
        background-color: white !important;
    }
`;

const FM_DATA_URL = 'https://raw.githubusercontent.com/Joystream/founding-members/main/data/fm-info.json';
const MILISECONDS_TO_DAYS = 1000 * 60 * 60 * 24;

type FoundingMembersData = {
  scoringPeriodsFull: {
    currentScoringPeriod: {
      started: string;
      ends: string;
    }
  }
}

const numberToDateString = (number: number) : string => {
  const remainingTime = [];

  const days = Math.floor(number);
  const hours = Math.floor((number - days) * 24);

  if (days >= 1) {
    remainingTime.push(days === 1 ? `${days} day` : `${days} days`);
  }

  if (hours >= 1) {
    remainingTime.push(hours === 1 ? `${hours} hour` : `${hours} hours`);
  }

  return remainingTime.join(' ');
};

const WindowBanner = () => {
  const [foundingMembersData, foundingMembersDataError, isFoundingMembersDataLoading] = usePromise<FoundingMembersData | undefined>(
    () => fetch(FM_DATA_URL).then((res) => res.json().then((data) => data as FoundingMembersData)), undefined, []
  );
  const [dates, setDates] = useState<{ started: Date, ends: Date }>();
  const [progress, setProgress] = useState<number>();
  const [remainingTimeString, setRemainingTimeString] = useState<string>();

  useEffect(() => {
    if (foundingMembersData && !foundingMembersDataError) {
      const ScoringPeriodStartedDate = new Date(foundingMembersData.scoringPeriodsFull.currentScoringPeriod.started);
      const ScoringPeriodEndedDate = new Date(foundingMembersData.scoringPeriodsFull.currentScoringPeriod.ends);
      const now = new Date();

      // calculate the elapsed time from start of scoring period until now
      const timeDifferenceBetweenDates = Math.abs(ScoringPeriodEndedDate.getTime() - ScoringPeriodStartedDate.getTime()) / MILISECONDS_TO_DAYS;
      const timePassedUntilNow = Math.abs(now.getTime() - ScoringPeriodStartedDate.getTime()) / MILISECONDS_TO_DAYS;
      const progressPercentage = (timePassedUntilNow / timeDifferenceBetweenDates) * 100;

      // calculate the amount of days remaining until the end of the scoring period
      const remainingTime = Math.abs(ScoringPeriodEndedDate.getTime() - now.getTime()) / MILISECONDS_TO_DAYS;

      setRemainingTimeString(numberToDateString(remainingTime));

      setDates({
        started: ScoringPeriodStartedDate,
        ends: ScoringPeriodEndedDate
      });

      setProgress(progressPercentage);
    }
  }, [foundingMembersData]);

  const renderContent = () => {
    if (isFoundingMembersDataLoading) {
      return (
        <Dimmer active>
          <Loader size='medium'>Loading</Loader>
        </Dimmer>
      );
    }

    if (foundingMembersDataError) {
      return <ErrorText> There&apos;s been some problem while fetching this data! </ErrorText>;
    }

    return (
      <>
        {
          progress && progress > 100
            ? <BannerText>
                The previous Founding Members scoring period has ended.
                You still have time to submit your activity report to make sure you are awarded for your contributions!
            </BannerText>
            : <>
              <CounterText>{remainingTimeString}</CounterText>
              <BannerText>
                  until the end of this Founding Members scoring period.
                  Make sure to report your activity to get the points for your contributions!
              </BannerText>
            </>
        }
        <ProgressContainer>
          <StyledProgress percent={progress && progress > 100 ? 100 : progress} />
          <DatesContainer>
            <DateText>{dates?.started.getDate()} {dates?.started.toLocaleString('default', { month: 'long' })}</DateText>
            <DateText>{dates?.ends.getDate()} {dates?.ends.toLocaleString('default', { month: 'long' })}</DateText>
          </DatesContainer>
        </ProgressContainer>
      </>
    );
  };

  return (
    <WindowBannerContainer>
      {renderContent()}
    </WindowBannerContainer>
  );
};

export default WindowBanner;
