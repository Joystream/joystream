import React from 'react'
import { Segment } from 'semantic-ui-react'
import { MutedDiv } from '@polkadot/joy-utils/MutedText'

export type ProposalTypePreviewProps = {
  name: string
  description: string
  requiredStake: number
  cancellationFee?: number
  gracePeriod: number
}

type ConditionProps = {
  label: string
  value: any
  suffix?: string
}

function Condition(props: ConditionProps) {
  const { label, value, suffix } = props;

  const valueWithSuffix = () => value + (suffix ? ' ' + suffix : '')

  return (
    <div className='condition'>
      <MutedDiv className='label'>{label}:</MutedDiv>
      <div className='value'>{value ? valueWithSuffix() : 'NONE'}</div>
    </div>
  )
}

export function ProposalTypePreview (props: ProposalTypePreviewProps) {

  return (
    <Segment padded className='ProposalTypePreview'>
      <h3 className='name'>{props.name}</h3>
      <div className='description'>{props.description}</div>
      <div className='conditions'>
        <Condition label='Required Stake' value={props.requiredStake} suffix='tJOY' />
        <Condition label='Cancellation Fee' value={props.cancellationFee} suffix='tJOY' />
        <Condition label='Grace Period' value={props.gracePeriod} />
      </div>
    </Segment>
  )
}
