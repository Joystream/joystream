import React from 'react';
import { BareProps } from '@polkadot/react-components/types';
import styled from 'styled-components';

const Header = styled.div`
  display: flex;
  width: 100%;
  justify-content: space-between;
  align-items: flex-end;
  margin-bottom: ${(props: { withPagination: boolean }) => props.withPagination ? '1rem' : 0};
  flex-wrap: wrap;
`;

const Title = styled.div`
  flex-grow: 1;
`;

const ResponsivePagination = styled.div`
  @media screen and (max-width: 767px) {
    & a[type=firstItem],
    & a[type=lastItem] {
      display: none !important;
    }
    & a {
      font-size: 0.8rem !important;
    }
  }
`;

const TopPagination = styled(ResponsivePagination)`
  margin-left: auto;
`;

const BottomPagination = styled(ResponsivePagination)`
  display: flex;
  justify-content: flex-end;
`;

type Props = BareProps & {
  className?: string;
  title?: JSX.Element | string;
  level?: number;
  pagination?: JSX.Element;
};

export default class Section extends React.PureComponent<Props> {
  render () {
    let { className, children, pagination } = this.props;
    className = (className || '') + ' JoySection';

    return (
      <section className={className}>
        <Header withPagination={ Boolean(pagination) }>
          <Title>{this.renderTitle()}</Title>
          { pagination && <TopPagination>{ pagination }</TopPagination> }
        </Header>
        <div>{children}</div>
        { pagination && <BottomPagination>{ pagination }</BottomPagination> }
      </section>
    );
  }

  private renderTitle = () => {
    const { title, level = 2, pagination } = this.props;
    if (!title) return null;

    const className = 'JoySection-title';
    const style = pagination ? { margin: '0' } : {};
    return React.createElement(
      `h${level}`,
      { className, style },
      title
    );
  }
}
