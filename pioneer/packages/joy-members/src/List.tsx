import BN from 'bn.js';
import React from 'react';

import { ApiProps } from '@polkadot/react-api/types';
import { I18nProps } from '@polkadot/react-components/types';

import Section from '@polkadot/joy-utils/Section';
import translate from './translate';
import Details from './Details';
import { MemberId } from '@joystream/types/members';
import { RouteComponentProps, Redirect } from 'react-router-dom';
import { Pagination, Icon, PaginationProps } from 'semantic-ui-react';
import styled from 'styled-components';

const StyledPagination = styled(Pagination)`
  border-bottom: 1px solid #ddd !important;
`;

type Props = ApiProps & I18nProps & RouteComponentProps & {
  firstMemberId: BN;
  membersCreated: BN;
  match: { params: { page?: string } };
};

type State = {};

const MEMBERS_PER_PAGE = 20;

class Component extends React.PureComponent<Props, State> {
  state: State = {};

  onPageChange = (e: React.MouseEvent, data: PaginationProps) => {
    const { history } = this.props;
    history.push(`/members/list/${data.activePage}`);
  }

  renderPagination (currentPage: number, pagesCount: number) {
    return (
      <StyledPagination
        pointing
        secondary
        activePage={ currentPage }
        ellipsisItem={{ content: <Icon name='ellipsis horizontal' />, icon: true }}
        firstItem={{ content: <Icon name='angle double left' />, icon: true }}
        lastItem={{ content: <Icon name='angle double right' />, icon: true }}
        prevItem={{ content: <Icon name='angle left' />, icon: true }}
        nextItem={{ content: <Icon name='angle right' />, icon: true }}
        totalPages={ pagesCount }
        onPageChange={ this.onPageChange }
      />
    );
  }

  render () {
    const {
      firstMemberId,
      membersCreated,
      match: { params: { page } }
    } = this.props;

    const membersCount = membersCreated.toNumber();
    const pagesCount = Math.ceil(membersCount / MEMBERS_PER_PAGE) || 1;
    const currentPage = Math.min(parseInt(page || '1'), pagesCount);

    if (currentPage.toString() !== page) {
      return <Redirect to={ `/members/list/${currentPage}` } />;
    }

    const ids: MemberId[] = [];
    if (membersCount > 0) {
      const firstId = firstMemberId.toNumber() + (currentPage - 1) * MEMBERS_PER_PAGE;
      const lastId = Math.min(firstId + MEMBERS_PER_PAGE, membersCount) - 1;
      for (let i = firstId; i <= lastId; i++) {
        ids.push(new MemberId(i));
      }
    }

    return (
      <Section
        title={`Members (${membersCount})`}
        pagination={ (pagesCount > 1 && this.renderPagination(currentPage, pagesCount)) || undefined }>
        {
          membersCount === 0
            ? <em>No registered members yet.</em>
            : (
              <div className='ui huge relaxed middle aligned divided list ProfilePreviews'>
                {ids.map((id, i) =>
                  <Details {...this.props} key={i} memberId={id} preview />
                )}
              </div>
            )
        }
      </Section>
    );
  }
}

export default translate(Component);
