import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom';

import { formatBalance } from '@polkadot/util';
import { Balance } from '@polkadot/types/interfaces';
import { GenericAccountId, u128 } from '@polkadot/types'

import { Accordion, Button, Container, Divider, Dropdown, Form, Grid, Header, Icon, Input, Label, Message, Modal, Segment, SemanticICONS, Step, Table } from 'semantic-ui-react'
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

    const tickLabel = <div className="ui pointing above label" style={{left: ((100/slotCount)*rank)+'%'}}>
        Your rank
        <div class="detail">{(slotCount-rank)+1}</div>
    </div>
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
                       min={props.minStake.toNumber()}
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
                <div className="scale">
                    {ticks}
                </div>
                {tickLabel}
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
    const [minStake, setMinStake] = useState(new u128(0)) // FIXME: dynamic_minimum
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

export type ConfirmStakes2UpProps = StakeSelectorProps & {
    step: Balance
    slots: Balance[]
}

export function ConfirmStakes2Up(props: ConfirmStakes2UpProps) {
    const slotCount = props.slots.length
    const [rank, setRank] = useState(1);

    // FIXME! These should be passed into the component
    const [applicationStake, setApplicationStake] = useState(props.application_stake.value)
    const [roleStake, setRoleStake] = useState(props.role_stake.value)
    const [valid, setValid] = useState(false)

    // FIXME! What if there are 0?
    const minStake = props.slots[0]

    const [combined, setCombined] = useState(new u128(0))

    // Watch stake values
    useEffect( () => {
            const newCombined = new u128(applicationStake.add(roleStake))
            setCombined(newCombined)
            setRank(findRankValue(newCombined))
            setValid(combined.gt(minStake))
        },
        [applicationStake, roleStake]
    )

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

    const ticks = []
    for (var i = 0; i < slotCount; i++) {
        ticks.push(<div key={i} className="tick" style={{width: (100/slotCount)+'%'}}>{slotCount-i}</div>)
    }

    const tickLabel = <div className="ui pointing below label" style={{left: ((100/slotCount)*rank)+'%'}}>
        Your rank
        <div class="detail">{(slotCount-rank)+1}</div>
    </div>

    let rankExplanation = <p>This role required a combined stake (applicationm stake plus role stake) of {formatBalance(minStake)}.</p>
    if (props.application_max > 0) {
        rankExplanation = (
            <Container>
               <p>
                    Only the top {props.application_max} applications, ranked by their combined <strong>application state</strong> and <strong>role stake</strong>, will be considered for this role.
               </p>
               <p>
                    There is a minimum application stake of {formatBalance(props.application_stake.value)} and a minimum role stake of {formatBalance(props.role_stake.value)} to apply for this role. 
                    However, in order to be in the top {props.application_max} applications, you wil need to stake a combined total of <strong>{formatBalance(minStake)}</strong>.
               </p>
            </Container>
        )
    }

    return (
        <Container className="confirm-stakes-2up">
            <Message info>
                <Message.Header><Icon name="shield"/> This role requires a minimum combined stake</Message.Header>
                    <Message.Content>
                        {rankExplanation}
                        <Grid stackable className="two-up">
                        <Grid.Row columns={2}>
                            <Grid.Column>
                                <h5>Application stake</h5>
                                <p>
                                    This role requires an application stake of at least <strong>{formatBalance(props.application_stake.value)}</strong>. 
                                    Along with the role stake, it will be used to rank candidates.
                                </p>
                                <p>
                                    Your application stake will be returned after the opening is resolved or your application ends.
                                </p>
                            </Grid.Column>
                            <Grid.Column>
                                <h5>Role stake</h5>
                                <p>
                                    This role requires a role stake of a least <strong>{formatBalance(props.role_stake.value)}</strong>. 
                                    This stake will be returned if your application is unsuccessful, and will also be used to rank applications. 
                                </p>
                                <p>
                                    If you're hired and then withdraw from the role, your role stake will be returned.
                                </p>
                            </Grid.Column>
                        </Grid.Row>
                        <Grid.Row columns={2}>
                            <Grid.Column>
                                <StakeRankMiniSelector step={props.step} 
                                                       value={applicationStake} 
                                                       setValue={setApplicationStake} 
                                                       min={props.application_stake.value}
                                />
                            </Grid.Column>
                            <Grid.Column>
                                <StakeRankMiniSelector step={props.step} 
                                                       value={roleStake} 
                                                       setValue={setRoleStake} 
                                                       min={props.role_stake.value}
                                />
                            </Grid.Column>
                        </Grid.Row>
                        <Grid.Row columns={1}>
                            <Grid.Column className="center">
                                <Label color='teal'>
                                    <Icon name='shield' />
                                    Minimum required stake
                                    <Label.Detail>{formatBalance(minStake)}</Label.Detail>
                                </Label>
                                <Label color={valid ? 'green' : 'red'}>
                                    <Icon name='times circle' />
                                    Your current combined stake
                                    <Label.Detail>{formatBalance(new u128(applicationStake.add(roleStake)))}</Label.Detail>
                                </Label>
                                <Label color='grey'>
                                    <Icon name={rankIcon(rank, slotCount)} />
                                    Estimated rank
                                    <Label.Detail>{rank}/{slotCount}</Label.Detail>
                                </Label>
                            </Grid.Column>
                        </Grid.Row>
                    </Grid>
            <div className="ticks">
                {tickLabel}
                <div className="scale">
                    {ticks}
                </div>
            </div>
                </Message.Content>
            </Message>
        </Container>
    )
}

type StakeRankMiniSelectorProps = {
    setValue: (b:Balance) => void
    value: Balance
    step: Balance
    min: Balance
}

function StakeRankMiniSelector(props: StakeRankMiniSelectorProps) {
    const changeValue = (e, {value}) => {
        if (value < 0) {
            console.log("<0",value)
            props.setValue(new u128(0))
            return
        }
        const newStake = new u128(value) 
        props.setValue(newStake)
        //setRank(findRankValue(newStake))
    }

    return (
        <Container className="controls">
            <Input label="JOY"  fluid
                   labelPosition="right" 
                   onChange={changeValue} 
                   type="number" 
                   min={props.min.toNumber()}
                   step={props.step.toNumber()}
                   value={props.value.toNumber() > 0 ? props.value.toNumber() : null} 
            />
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
