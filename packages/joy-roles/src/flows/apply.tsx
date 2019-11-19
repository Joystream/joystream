import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom';

import { formatBalance } from '@polkadot/util';
import { Balance } from '@polkadot/types/interfaces';
import { GenericAccountId, u128 } from '@polkadot/types'

import { Accordion, Button, Container, Dropdown, Form, Grid, Header, Icon, Input, Label, Message, Modal, Step, Table } from 'semantic-ui-react'
import { Slider } from "react-semantic-ui-range";

import Identicon from '@polkadot/react-identicon';
import { AccountId } from '@polkadot/types/interfaces';

import { 
    GroupMemberView, GroupMemberProps,
} from '../elements'
import {
    OpeningBodyApplicationsStatus, OpeningBodyApplicationsStatusProps,
    ApplicationCount, 
    StakeRequirementProps,
  IStakeRequirement,
} from '../tabs/Opportunities'

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

function KeyPair ({ address, className, isUppercase, name, style, balance }: Props): React.ReactElement<Props> {
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
          {formatBalance(balance)}
      </div>
      <div className='address'>
        {address}
      </div>
    </div>
  );
}


export type keyPairDetails = {
    shortName: string
    accountId: AccountId
    balance: Balance
}

export type FundSourceSelectorProps = {
    transactionFee: Balance
    keypairs: keyPairDetails[]
}

type FundSourceCallbackProps = {
    addressCallback?: (address: AccountId) => void
    passphraseCallback?: (passphrase: string) => void
}

export function FundSourceSelector( props: FundSourceSelectorProps & FundSourceCallbackProps) {
    const pairs = [];

    const onChangeDropdown = (e, {value}) => {
        if (typeof props.addressCallback !== "undefined") {
            props.addressCallback(new GenericAccountId(value))
        }
    }

    const onChangeInput = (e, {value}) => {
        if (typeof props.passphraseCallback !== "undefined") {
            props.passphraseCallback(value)
        }
    }

    props.keypairs.map((v) => {
        if (v.balance.lt(props.transactionFee)) {
            return
        }

        pairs.push({
            key: v.shortName,
            text: ( 
                   <KeyPair address={v.accountId.toString()}
                            name={v.shortName}
                            balance={v.balance}
                            isUppercase={true} 
                    /> 
            ),
            value: v.accountId,
        })
    })

    useEffect(() => {
        if (pairs.length > 0 && typeof props.addressCallback !== "undefined") {
            props.addressCallback(new GenericAccountId(pairs[0].accountId))
        }
    }, [])

    return (
      <Form className="fund-source-selector">
          <Form.Field>
              <label>Select source of funds</label>
              <Form.Dropdown
                placeholder='Source'
                fluid
                selection
                options={pairs}
                onChange={onChangeDropdown}
                defaultValue={pairs.length > 0 ? pairs[0].value : null}
              />
          </Form.Field>
          <Form.Field>
              <label>Unlock key with passphrase</label>
              <Input placeholder='Passphrase' 
                     type="password" 
                     onChange={onChangeInput}
              />
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

export enum ProgressSteps {
    ConfirmStakes = 0,
    SubmitApplication,
    Done,
}

export type ProgressStepsProps = {
    activeStep: ProgressSteps
    hasConfirmStep: boolean
}

interface ProgressStep {
    name: string
    display: boolean
    active: boolean
    disabled: boolean
}

function ProgressStepView(props: ProgressStep) {
    if (!props.display) {
        return null
    }

    return (
        <Step active={props.active} disabled={props.disabled} key={props.name}>
          <Step.Content>
            <Step.Title>{props.name}</Step.Title>
          </Step.Content>
        </Step>
    )
}

export function ProgressStepsView(props: ProgressStepsProps) {
    const steps:ProgressStep[] = [
        { 
            name: "Confirm stakes",  
            display: props.hasConfirmStep,
        },
        { 
            name: "Submit application", 
            display: true,
        },
        { 
            name: "Done", 
            display: true,
        },
    ]
    return (
      <Step.Group stackable='tablet'>
        {steps.map((step, key) => (
            <ProgressStepView 
                {...step} 
                active={key === props.activeStep} 
                disabled={key > props.activeStep} 
            />
        ))}
      </Step.Group>
    )
}

export type StageTransitionProps = FlowModalProps & {
    nextTransition: () => void
}

export type ApplicationStatusProps = {
  application_count: number
}

export type ConfirmStakesStageProps = StageTransitionProps & 
                                      StakeRequirementProps & 
                                      FundSourceSelectorProps &
                                      ApplicationStatusProps

export function ConfirmStakesStage(props: ConfirmStakesStageProps) {
    const [address, setAddress] = useState<AccountId>()
    const [passphrase, setPassphrase] = useState("")
    const [minStake, setMinStake] = useState(new u128(0)) // FIXME
    const [appStake, setAppStake] = useState(new u128(0))
    const [roleStake, setRoleStake] = useState(new u128(0))

    let content = null
    if (bothStakesVariable(props)) {
        content = <ConfirmStakes2Up {...props} setApplicationStake={setAppStake} setRoleStake={setRoleStake} />
    } else {
        content = <ConfirmStakes1Up {...props} setApplicationStake={setAppStake} setRoleStake={setRoleStake} />
    }

    return (
      <Container className="content">
          {content}
          <Header as='h4'>Source of stake funds</Header>
          <p>Please select the account that will be used as the source of stake funds.</p>
          <FundSourceSelector {...props} 
                              transactionFee={minStake}
                              addressCallback={setAddress} 
                              passphraseCallback={setPassphrase} 
          />


          <Container className="cta">
              <Button content='Cancel' icon='cancel' labelPosition='left' />
              <Button 
                  content='Confirm stake and continue' 
                  icon='right arrow' 
                  labelPosition='right' 
                  positive 
                  onClick={props.nextTransition}
              />
          </Container>
      </Container>
    )
}

function bothStakesVariable(props: StakeRequirementProps): boolean {
    return props.application_stake.anyRequirement() && props.role_stake.anyRequirement() &&
           props.application_stake.atLeast() && props.role_stake.atLeast()
}

type StakeSelectorProps = ConfirmStakesStageProps & ApplicationStatusProps & {
    setApplicationStake: (b:Balance) => void
    setRoleStake: (b:Balance) => void
}

function ConfirmStakes1Up(props: StakeSelectorProps) {
  let applicationStake = null
  if (props.application_stake.anyRequirement()) {
    applicationStake = <CaptureStake1Up 
                          name="application stake"
                          return_policy="after the opening is resolved or your application ends"
                          colour="yellow"
                          requirement={props.application_stake}
                          setValue={props.setApplicationStake}
                          application_max={props.application_max}
                          application_count={props.application_count}
                     />
  }
  
  let roleStake = null
  if (props.role_stake.anyRequirement()) {
   roleStake = <CaptureStake1Up 
                          name="role stake"
                          return_policy="after the opening is resolved or your application ends"
                          colour="red"
                          requirement={props.role_stake}
                          setValue={props.setRoleStake}
                          application_max={props.application_max}
                          application_count={props.application_count}
                     />
  }


  return (
      <Container className="stakes 1-up">
        {applicationStake}
        {roleStake}
      </Container>
    )
}

function ConfirmStakes2Up(props: StakeSelectorProps) {
    return (
        <Container className="application stage">
            <h4>FIXME</h4>
        </Container>
    )
}

type CaptureStake1UpProps = ApplicationStatusProps & {
  name: string
  return_policy: string
  colour: string
  requirement: IStakeRequirement
  setValue: (b: Balance) => void
  application_max: number
}

function CaptureStake1Up(props: CaptureStake1UpProps) {
  let limit = null
  if (props.application_max > 0) {
    limit = (
      <span> This will be used to rank candidates, and only the top <strong>{props.application_max}</strong> will be considered. </span>
    )
  }

 return (
     <Message info={props.colour === 'yellow'} warning={props.colour === 'red'} className={props.name}>
       <Message.Header><Icon name="shield"/> {props.name}</Message.Header>
       <Message.Content>
        <p>
         <span>This role requires an <strong>{props.name}</strong> of <strong>{formatBalance(props.requirement.value)}</strong>.</span>
            {limit}
           <span> There are currently <strong>{props.application_count}</strong> applications. </span>
        </p>
        <p>
           Your <strong>{props.name}</strong> will be returned {props.return_policy}.
         </p>
        </Message.Content>
       </Message>
    )
}

export type SubmitApplicationStageProps = FundSourceSelectorProps & 
                                          StageTransitionProps & {
    transactionFee: Balance
    transactionDetails: Map<string, string>
}

export function SubmitApplicationStage(props: SubmitApplicationStageProps) {
    const [address, setAddress] = useState<AccountId>()
    const [passphrase, setPassphrase] = useState("")

    const onSubmit = () => {
        props.nextTransition()
    }

    return (
      <Container className="content">
          <p>
              You need to make a transaction to apply for this role. 
              There is a fee of <strong>{formatBalance(props.transactionFee)}</strong> for this transaction.
          </p>
          <ModalAccordion title="Technical transaction details">
             <Table basic='very'>
               <Table.Body>
                  {[...props.transactionDetails].map((v, k) => (
                      <Table.Row key={k}>
                        <Table.Cell>{v[0]}</Table.Cell>
                        <Table.Cell>{v[1]}</Table.Cell>
                      </Table.Row>
                  ))}
                </Table.Body>
              </Table>
          </ModalAccordion>
          
          <Header as='h4'>Source of transaction fee funds</Header>
          <p>Please select the account that will be used as the source of transaction fee funds.</p>
          <FundSourceSelector {...props} 
                              addressCallback={setAddress} 
                              passphraseCallback={setPassphrase} 
          />

          <Container className="cta">
              <Button content='Cancel' icon='cancel' labelPosition='left' />
              <Button 
                  content='Make transaction and submit application' 
                  icon='right arrow' 
                  labelPosition='right' 
                  positive 
                  onClick={onSubmit}
              />
          </Container>
      </Container>
    )
}

export type DoneStageProps = {
    applications: OpeningBodyApplicationsStatusProps
    roleKeyName: string
}

export function DoneStage(props: DoneStageProps) {
    return (
      <Container className="content">
          <h4>Application submitted!</h4>
          <p>
              Your application is <strong>#<ApplicationCount {...props.applications} applied={true} /></strong>. 
              Once the group lead has started their review, your application will be considered.
          </p>
          <p>
              You can track the progress of your
              application in the <Link to="#roles/my-roles">My roles</Link> section. If you have any issues,
                  you can raise them in in the <Link to="#forum">Forum</Link> or contact the group lead
              directly.
          </p>

          <h4>Your new role key</h4>
          <p>
              This role requires a new sub-key to be associated with your account. 
              You'll never have to use the key directly, but you will need it in order 
              to perform any duties in the role.
          </p>
          <p>
              We've generated a new role key, <strong>{props.roleKeyName}</strong>, automatically. You can 
              download its backup file using the button below, or from the <Link to="#accounts">My account</Link> 
              &nbsp; section.
          </p>
          <Message warning>
              <strong>Please make sure to save this file in a secure location as it is the only 
              way to restore your role key!</strong>
          </Message>
          <Container className="cta">
              <Button content='Download role key backup' icon='download' labelPosition='left' primary />
              <Button 
                  content='Go to My Roles' 
                  icon='right arrow' 
                  labelPosition='right' 
                  color='teal'
              />
          </Container>

       </Container>
    )
}

export type FlowModalProps = FundSourceSelectorProps & {
    applications: OpeningBodyApplicationsStatusProps,
    creator: GroupMemberProps
}

export function FlowModal(props: FlowModalProps) {
    const hasConfirmStep = false
    const [activeStep, setActiveStep] = useState(ProgressSteps.SubmitApplication)
    const [complete, setComplete] = useState(false)
    
    const enterDoneState = () => {
        setComplete(true)
        setActiveStep(ProgressSteps.Done)
    }

    const [stage, setStage] = useState(<SubmitApplicationStage {...props} nextTransition={enterDoneState} />)

    // Watch for state changes
    useEffect( 
        () => {
            switch(activeStep) {
                case ProgressSteps.ConfirmStakes:
                    setStage(<ConfirmStakesStage {...props} nextTransition={enterDoneState} />)
                    break

                case ProgressSteps.SubmitApplication:
                    setStage(<SubmitApplicationStage {...props} nextTransition={enterDoneState} />)
                    break

                case ProgressSteps.Done:
                    setStage(<DoneStage {...props} />)
                    break
            }
        },
        [activeStep],
    )

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
                        <ProgressStepsView activeStep={activeStep} hasConfirmStep={hasConfirmStep} />
                        {stage}
                    </Grid.Column>
                    <Grid.Column width={5} className="summary">
                        <Header as='h3'>Help us curate awesome content</Header>
                    <Label as='h1' size='large' ribbon='right' className="fluid standout">
                        Reward
                        <Label.Detail>10 UNIT per block</Label.Detail>
                    </Label>
                    <OpeningBodyApplicationsStatus {...props.applications} applied={complete} />
                    <h5>Group lead</h5>
                    <GroupMemberView {...props.creator} inset={true} />
                  </Grid.Column>
                </Grid>
            </Container>
          </Modal.Content>
        </Modal>
    )
}
