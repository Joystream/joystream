import React, { useState } from 'react'

import { Accordion, Button, Container, Dropdown, Form, Grid, Header, Icon, Input, Label, Modal, Step, Table } from 'semantic-ui-react'
import { Slider } from "react-semantic-ui-range";

import Identicon from '@polkadot/react-identicon';

import { 
    GroupMemberView, GroupMemberProps,
} from '../elements'
import {
    OpeningBodyApplicationsStatus, OpeningBodyApplicationsStatusProps,
} from '../tabs/Opportunities'

export type FlowModalProps = {
    applications: OpeningBodyApplicationsStatusProps,
    creator: GroupMemberProps
}

type accordionProps = {
    title: string
}

function ModalAccordion(props: React.PropsWithChildren<accordionProps>) {
    const [open, setOpen] = useState(false)
    return (
       <Accordion>
          <Accordion.Title index={0} active={open} onClick={() => { setOpen(!open) }} >
          <Icon name='dropdown' />
          {props.title}
        </Accordion.Title>
        <Accordion.Content active={open}>{props.children}</Accordion.Content>
      </Accordion>
    )
}

function KeyPair ({ address, className, isUppercase, name, style }: Props): React.ReactElement<Props> {
  return (
    <div
      className={['keypair', className].join(' ')}
      style={style}
    >
	  <Identicon value={address} size={14} />
      <div className={`name ${isUppercase ? 'uppercase' : 'normalcase'}`}>
        {name}
      </div>
      <div className='balance'>
        100 JOY
      </div>
      <div className='address'>
        {address}
      </div>
    </div>
  );
}

type FundSourceSelectorProps = {
}

function FundSourceSelector( props: FundSourceSelectorProps) {
    const friendOptions = [
        {
            key: 'Elliot Fu',
            text: ( <KeyPair address="5HZ6GtaeyxagLynPryM7ZnmLzoWFePKuDrkb4AT8rT4pU1fp" name="short-name" isUppercase={true} /> ),
            value: 'Elliot Fu',
        },
        {
            key: 'Elliot Fu',
            text: ( <KeyPair address="5HZ6GtaeyxagLynPryM7ZnmLzoWFePKuDrkb4AT8rT4pU1fp" name="short-name" isUppercase={true} /> ),
            value: 'Elliot Fu',
        },
    ]

    return (
	  <Form className="fund-source-selector">
		  <Form.Field>
			  <label>Select source of funds</label>
			  <Dropdown
				placeholder='Source'
				fluid
				selection
				options={friendOptions}
			  />
		  </Form.Field>
		  <Form.Field>
			  <label>Unlock key with passphrase</label>
			  <Input placeholder='Passphrase' type="password" />
		  </Form.Field>
	  </Form>
    )
}

function rankIcon(place: number, slots: number): string {
	if (place <= 1) {
		return 'thermometer empty'
	} else if (place <= (slots/4)) {
		return 'thermometer quarter'
	} else if (place <= (slots/2)) {
		return 'thermometer half'
	} else if (place > (slots/2) && place < slots) {
		return 'thermometer three quarters'
	}
	return 'thermometer'
}

function StakeRankSelector() {
	const slots = 20
	const [value, setValue] = useState(11);
	const settings = {
		min: 0,
		max: slots,
		step: 1,
		onChange: value => {
			setValue(value);
		}
  };
  const ticks = []
  for (var i = 0; i < slots; i++) {
	  ticks.push(<div class="tick" style={{width: (100/slots)+'%'}}>{slots-i}</div>)
  }
	return (
		<Container className="stake-rank-selector">
			<div className="controls">
				<Button circular icon='angle double left' onClick={() => {setValue(1)}} />
				<Button circular icon='angle left' onClick={() => {setValue(value-1)}} />
				<Input label="JOY" labelPosition="right" type="number"  />
				<Button circular icon='angle right' onClick={() => {setValue(value+1)}} />
				<Button circular icon='angle double right' onClick={() => {setValue(slots)}} />
				<p>
				<Label size='large'>
					<Icon name={rankIcon(value, slots)} />
					Estimated rank
					<Label.Detail>{(slots+1)-value}</Label.Detail>
				</Label>
					</p>
			</div>

			<Slider className="labeled" value={value} color="teal" settings={settings} />
			<div className="ticks">
				{ticks}
			</div>
		</Container>
	)
}

export function FlowModal(props: FlowModalProps) {
    return (
        <Modal size='fullscreen' open={true} dimmer='inverted' className="apply-flow">
            <Modal.Content>
                <Container>
                    <Grid columns="equal">
                        <Grid.Column width={11} className="title">
                            <Label as='h1' color='green' size='huge' ribbon>
                                <Icon name='heart' />
								Applying for
								<Label.Detail>Content curator</Label.Detail>
							</Label>
                      </Grid.Column>
            <Grid.Column width={5} className="cancel">
                <a href="">
                    <Icon name='cancel' /> Cancel application
                </a>
            </Grid.Column>
        </Grid>
        <Grid columns="equal">
            <Grid.Column width={11} className="main">
                <Step.Group stackable='tablet'>
                    <Step active>
                      <Step.Content>
                        <Step.Title>Confirm stakes</Step.Title>
                      </Step.Content>
                    </Step>
                    <Step>
                      <Step.Content>
                        <Step.Title>Submit application</Step.Title>
                      </Step.Content>
                    </Step>
                    <Step disabled>
                      <Step.Content>
                        <Step.Title>Done</Step.Title>
                      </Step.Content>
                    </Step>
                  </Step.Group>
                  <Container className="content">
                      <p>
                          You need to make a transaction to apply for this role. There is a fee of <strong>1.000 JOY</strong> for this transaction.
                      </p>
                      <ModalAccordion title="Technical transaction details">
                         <Table basic='very'>
                           <Table.Body>
                              <Table.Row>
                                <Table.Cell>Extrinsic hash</Table.Cell>
                                <Table.Cell>0xae6d24d4d55020c645ddfe2e8d0faf93b1c0c9879f9bf2c439fb6514c6d1292e</Table.Cell>
                              </Table.Row>
                              <Table.Row>
                                <Table.Cell>Something else</Table.Cell>
                                <Table.Cell>abc123</Table.Cell>
                              </Table.Row>
                            </Table.Body>
                          </Table>
                      </ModalAccordion>
                      
                      <Header as='h4'>Source of transaction fee funds</Header>
                      <p>Please select the account that will be used as the source of transaction fee funds.</p>
                      <FundSourceSelector />

					  <StakeRankSelector />

					  <Container className="cta">
						  <Button content='Cancel' icon='cancel' labelPosition='left' />
						  <Button content='Make transaction and submit application' icon='right arrow' labelPosition='right' positive />
					  </Container>
                  </Container>
            </Grid.Column>
            <Grid.Column width={5} className="summary">
                <Header as='h3'>Help us curate awesome content</Header>
            <Label as='h1' size='large' ribbon='right' className="fluid standout">
                Reward
                    <Label.Detail>10 UNIT per block</Label.Detail>
            </Label>
             <OpeningBodyApplicationsStatus {...props.applications} />
             <h5>Group lead</h5>
             <GroupMemberView {...props.creator} inset={true} />
          </Grid.Column>
        </Grid>
            </Container>
          </Modal.Content>
        </Modal>
    )
}
