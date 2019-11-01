import React from 'react'
import { Table } from 'semantic-ui-react';

import { BareProps } from '@polkadot/react-components/types';
import { Actor } from '@joystream/types/roles';

type Props = BareProps & {
    actors: Actor[]
}

export function StorageAndDistribution(props: Props) {
    return (
        <section id="storage-providers">
            <Table>
                <Table.Header>
                    <Table.Row>
                        <Table.HeaderCell>ID</Table.HeaderCell>
                        <Table.HeaderCell>Role</Table.HeaderCell>
                        <Table.HeaderCell>Member account</Table.HeaderCell>
                    </Table.Row>
                </Table.Header>
                <Table.Body>
                    {props.actors.map((actor) => (
                        <Table.Row>
                            <Table.Cell>{actor.member_id.toString()}!</Table.Cell>
                            <Table.Cell>Storage and distribution</Table.Cell>
                            <Table.Cell>{actor.account.toString()}!</Table.Cell>
                        </Table.Row>
                    ))}
                </Table.Body>
            </Table>
        </section>
    )
}
