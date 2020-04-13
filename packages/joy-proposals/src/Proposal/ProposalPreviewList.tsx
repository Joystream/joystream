import React, { useState } from 'react';
import { Card, Menu, Container } from 'semantic-ui-react';

import { ProposalProps } from './ProposalDetails';
import ProposalPreview from './ProposalPreview';

type ProposalFilter = 'all' | 'active' | 'withdrawn' | 'approved' | 'rejected' | 'slashed';

export default function ProposalPreviewList({ proposals }: { proposals: ProposalProps[] }) {
    const [activeFilter, setActiveFilter] = useState<ProposalFilter>('all');
    const proposalsMap = new Map();

    proposalsMap.set('all', proposals);
    proposalsMap.set('withdrawn', filterProposals('withdrawn', proposals));
    proposalsMap.set('active', filterProposals('withdrawn', proposals));
    proposalsMap.set('approved', filterProposals('approved', proposals));
    proposalsMap.set('rejected', filterProposals('rejected', proposals));
    proposalsMap.set('slashed', filterProposals('slashed', proposals));

    return (
        <Container className="Proposal">
            <Menu tabular className="list-menu">
                <Menu.Item
                    name={`all - ${proposalsMap.get('withdrawn').length} `}
                    active={activeFilter === 'all'}
                    onClick={() => setActiveFilter('all')}
                />
                <Menu.Item
                    name={`withdrawn (${proposalsMap.get('withdrawn').length})`}
                    active={activeFilter === 'withdrawn'}
                    onClick={() => setActiveFilter('withdrawn')}
                />
                <Menu.Item
                    name={`active (${proposalsMap.get('active').length})`}
                    active={activeFilter === 'active'}
                    onClick={() => setActiveFilter('active')}
                />
                <Menu.Item
                    name={`approved (${proposalsMap.get('approved').length})`}
                    active={activeFilter === 'approved'}
                    onClick={() => setActiveFilter('approved')}
                />
                <Menu.Item
                    name={`rejected (${proposalsMap.get('rejected').length})`}
                    active={activeFilter === 'rejected'}
                    onClick={() => setActiveFilter('rejected')}
                />
                <Menu.Item
                    name={`slashed (${proposalsMap.get('slashed').length})`}
                    active={activeFilter === 'slashed'}
                    onClick={() => setActiveFilter('slashed')}
                />
            </Menu>

            <Card.Group>
                {proposalsMap.get(activeFilter).map((prop, idx) => (
                    <ProposalPreview
                        key={`${prop.title}-${idx}`}
                        title={prop.title}
                        description={prop.description}
                        details={prop.details}
                    />
                ))}
            </Card.Group>
        </Container>
    );
}

function filterProposals(filter, proposals) {
    if (filter === 'all') {
        return proposals;
    } else if (filter === 'active') {
        return proposals.filter((prop: any) => prop.details.stage === 'active');
    }

    return proposals.filter((prop: any) => prop.finalized === filter);
}
