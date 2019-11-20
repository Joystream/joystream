import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom';

import { formatBalance } from '@polkadot/util';
import { Balance } from '@polkadot/types/interfaces';
import { GenericAccountId, u128 } from '@polkadot/types'

import { Accordion, Button, Container, Dropdown, Form, Grid, Header, Icon, Input, Label, Message, Modal, SemanticICONS, Step, Table } from 'semantic-ui-react'
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

export type StakeRankSelectorProps = {
    minStake: Balance
    slots: Balance[] // List of stakes to beat
    stake: Balance
    setStake: (b:Balance) => void
    step: Balance
}

export function StakeRankSelector(props: StakeRankSelectorProps) {
    const slotCount = props.slots.length
    const [rank, setRank] = useState(1);
    const settings = {
        min: 0,
        max: slotCount,
        step: 1,
        onChange: value => {
            if (value >= props.slots.length) {
                value = props.slots.length
            } else if (value > 0 && !focused) {
                props.setStake(props.slots[value-1])
            } else if (!focused) {
                props.setStake(props.minStake)
            }
            setRank(value)
        }
    };

    const ticks = []
    for (var i = 0; i < slotCount; i++) {
        ticks.push(<div key={i} className="tick" style={{width: (100/slotCount)+'%'}}>{slotCount-i}</div>)
    }
    const slider = <Slider className="labeled" rank={rank} color="teal" settings={settings} />

    const findRankValue = (newStake: Balance): number => {
        if (newStake.gt(props.slots[slotCount-1])) {
            return slotCount
        }

        for (let i = slotCount; i--; i >= 0) {
            if (newStake.gt(props.slots[i])) {
                return i+1
            }
        }

        return 0
    }

    const [focused, setFocused] = useState(false)

    const changeValue = (e, {value}) => {
        const newStake = new u128(value) 
        props.setStake(newStake)
        setRank(findRankValue(newStake))
    }

	useEffect( () => {
		props.setStake(props.minStake)
	}, [])

    return (

        <Container className="stake-rank-selector">
            <h4>Choose a stake</h4>
            <div className="controls">
                <Button circular icon='angle double left' onClick={() => {setRank(1)}} />
                <Button circular icon='angle left' onClick={() => {rank > 1 && setRank(rank-1)}} />
                <Input label="JOY" 
                       labelPosition="right" 
                       onChange={changeValue} 
                       type="number" 
                       onBlur={() => {setFocused(false)}}
                       onFocus={() => {setFocused(true)}}
                       step={props.step.toNumber()}
                       value={props.stake.toNumber() > 0 ? props.stake.toNumber() : null} 
                />
                <Button circular icon='angle right' onClick={() => {rank <= slotCount && setRank(rank+1)}} />
                <Button circular icon='angle double right' onClick={() => {setRank(slotCount)}} />
                <p>
                    <Label size='large'>
                        <Icon name={rankIcon(rank, slotCount)} />
                        Estimated rank
                        <Label.Detail>{(slotCount+1)-rank} / {slotCount}</Label.Detail>
                    </Label>
                    <Label size='large'>
                        <Icon name="shield" />
                        Your stake
                        <Label.Detail>{formatBalance(props.stake)}</Label.Detail>
                    </Label>
                </p>
            </div>

            <Slider discrete className="labeled" value={rank} color="teal" settings={settings} />
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

type CTACallback = () => void

type CTAProps = {
    negativeLabel: string
    negativeIcon: SemanticICONS
    negativeCallback: CTACallback
    positiveLabel: string
    positiveIcon: SemanticICONS
    positiveCallback: CTACallback
}

function CTA(props: CTAProps) {
    return (
        <Container className="cta">
            <Button 
                content={props.negativeLabel}
                icon={props.negativeIcon}
                labelPosition='left' 
                  onClick={props.negativeCallback}
            />
            <Button 
                  content={props.positiveLabel}
                  icon={props.positiveIcon}
                  labelPosition='right' 
                  positive 
                  onClick={props.positiveCallback}
            />
        </Container>
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
									  ApplicationStatusProps &
									  StakeRankSelectorProps

export function ConfirmStakesStage(props: ConfirmStakesStageProps) {
    const [address, setAddress] = useState<AccountId>()
    const [passphrase, setPassphrase] = useState("")
    const [minStake, setMinStake] = useState(new u128(0)) // FIXME
    const [appStake, setAppStake] = useState(new u128(0))
    const [roleStake, setRoleStake] = useState(new u128(0))

    const ctaContinue = (zeroOrTwoStakes(props)) ?
        'Confirm stakes and continue' :
        'Confirm stake and continue';

    return (
      <Container className="content">
          <ConfirmStakes {...props} setApplicationStake={setAppStake} setRoleStake={setRoleStake} />

          <Header as='h4'>Source of stake funds</Header>
          <p>Please select the account that will be used as the source of stake funds.</p>
          <FundSourceSelector {...props} 
                              transactionFee={minStake}
                              addressCallback={setAddress} 
                              passphraseCallback={setPassphrase} 
          />
        
          <CTA
              negativeLabel='Cancel'
              negativeIcon='cancel'
              negativeCallback={() => {}}
              positiveLabel={ctaContinue}
              positiveIcon='right arrow'
              positiveCallback={props.nextTransition}
          />
      </Container>
    )
}

function stakeCount(props: StakeRequirementProps): number {
    return (props.application_stake.anyRequirement() ? 1 : 0) +
           (props.role_stake.anyRequirement() ? 1 : 0)
}

function zeroOrTwoStakes(props: StakeRequirementProps): boolean {
    const count = stakeCount(props)
    return (count == 0 || count == 2)
}

function bothStakesVariable(props: StakeRequirementProps): boolean {
    return props.application_stake.anyRequirement() && props.role_stake.anyRequirement() &&
           props.application_stake.atLeast() && props.role_stake.atLeast()
}

type StakeSelectorProps = ConfirmStakesStageProps & ApplicationStatusProps & {
    setApplicationStake: (b:Balance) => void
    setRoleStake: (b:Balance) => void
}

function ConfirmStakes(props: StakeSelectorProps) {
    if (bothStakesVariable(props)) {
       return <ConfirmStakes2Up {...props} />
    } 

    return <ConfirmStakes1Up {...props} />
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
		                  {...props}
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
		                  {...props}
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

	// Set default value
	useEffect(() => {
		props.setValue(props.requirement.value)
	}, [])

	let slider = null
	let atLeast = null
	if (props.requirement.atLeast()) {
		slider = <StakeRankSelector {...props} />
		atLeast = 'at least '
    }

    return (
     <Message info={props.colour === 'yellow'} warning={props.colour === 'red'} className={props.name}>
       <Message.Header><Icon name="shield"/> {props.name}</Message.Header>
       <Message.Content>
        <p>
         <span>This role requires an <strong>{props.name}</strong> of {atLeast}<strong>{formatBalance(props.requirement.value)}</strong>.</span>
            {limit}
           <span> There are currently <strong>{props.application_count}</strong> applications. </span>
        </p>
        <p>
           Your <strong>{props.name}</strong> will be returned {props.return_policy}.
         </p>
        </Message.Content>
          {slider}
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

          <CTA
              negativeLabel='Cancel'
              negativeIcon='cancel'
              negativeCallback={() => {}}
              positiveLabel='Make transaction and submit application'
              positiveIcon='right arrow'
              positiveCallback={onSubmit}
          />
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
