import React, { useEffect } from 'react';
import styled from 'styled-components';
import { Icon, Label } from 'semantic-ui-react';

const ChartContainer = styled('div')`
  display:flex;
  flex-direction:column;
  align-items:center;
`;

const PieChart: React.FC<{icon: any; typeOfChart: string; percentages: Array<{ percent: any; color: string}>}> = ({ icon, typeOfChart, percentages }) => {
  let cumulativePercent = 0;

  const getCoordinatesForPercent = (percent: number): Array<number> => {
    const x = Math.cos(2 * Math.PI * percent);
    const y = Math.sin(2 * Math.PI * percent);
    return [x, y];
  };

  useEffect(() => {
    if (percentages) {
      const svgEl = document.querySelector(`#pieChart${typeOfChart}`) as Element;
      percentages.forEach(slice => {
        const [startX, startY] = getCoordinatesForPercent(cumulativePercent);
        cumulativePercent += slice.percent;
        const [endX, endY] = getCoordinatesForPercent(cumulativePercent);
        const largeArcFlag = slice.percent > 0.5 ? 1 : 0;
        const pathData = [
          `M ${startX} ${startY}`,
          `A 1 1 0 ${largeArcFlag} 1 ${endX} ${endY}`,
          'L 0 0'
        ].join(' ');

        const pathEl = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        pathEl.setAttribute('d', pathData);
        pathEl.setAttribute('fill', slice.color);
        svgEl.appendChild(pathEl);
      });
    }
  }, []);
  return (
    <ChartContainer>
      <svg id={`pieChart${typeOfChart}`} viewBox="-1 -1 2 2" style={{ transform: 'rotate(-90deg)', marginBottom: '2rem' }}></svg>
      <Label as='div'>
        <Icon name={icon} />
        <span style={{ fontWeight: 600 }}>{typeOfChart}</span>
      </Label>
    </ChartContainer>
  );
};

export default PieChart;
