import React from 'react'
import { ToggleButton } from '../components'
import { text, withKnobs } from '@storybook/addon-knobs'
import { action } from '@storybook/addon-actions'

export default {
  title: 'ToggleButton',
  component: ToggleButton,
  decorators: [withKnobs],
}

export const Primary = () => (
  <>
    <ToggleButton onClick={() => action('ToggleButton Clicked')}>{text('ToggleButton Text', 'Regular')}</ToggleButton>
    <ToggleButton size="small" onClick={() => action('ToggleButton Clicked')}>
      Small
    </ToggleButton>
    <ToggleButton size="smaller" onClick={() => action('ToggleButton Clicked')}>
      Smaller
    </ToggleButton>
  </>
)

export const Secondary = () => (
  <>
    <ToggleButton variant="secondary" onClick={() => action('ToggleButton Clicked')}>
      Regular
    </ToggleButton>
    <ToggleButton variant="secondary" size="small">
      Small
    </ToggleButton>
    <ToggleButton variant="secondary" size="smaller">
      Has no onClik
    </ToggleButton>
  </>
)

export const PrimaryFullSize = () => <ToggleButton full>Primary Full Size</ToggleButton>

export const SecondaryFullSize = () => (
  <ToggleButton full variant="secondary">
    Secondary Full Size
  </ToggleButton>
)

export const PrimaryWithIcon = () => (
  <>
    <ToggleButton icon>Regular</ToggleButton>
    <ToggleButton icon size="small">
      Small
    </ToggleButton>
    <ToggleButton icon size="smaller">
      Smaller
    </ToggleButton>
  </>
)

export const SecondaryWithIcon = () => (
  <>
    <ToggleButton variant="secondary" icon>
      Regular
    </ToggleButton>
    <ToggleButton variant="secondary" icon size="small">
      Small
    </ToggleButton>
    <ToggleButton variant="secondary" icon size="smaller">
      Smaller
    </ToggleButton>
  </>
)

export const PrimaryWithoutText = () => (
  <>
    <ToggleButton icon />
    <ToggleButton icon size="small" />
    <ToggleButton icon size="smaller" />
  </>
)

export const SecondaryWithoutText = () => (
  <>
    <ToggleButton variant="secondary" icon />
    <ToggleButton variant="secondary" icon size="small" />
    <ToggleButton variant="secondary" icon size="smaller" />
  </>
)

export const Disabled = () => (
  <>
    <ToggleButton disabled={true} onClick={() => action('Clicked a disabled ToggleButton, this should not happen.')}>
      Disabled
    </ToggleButton>
    <ToggleButton disabled={true} icon={true}>
      Disabled with icon
    </ToggleButton>
    <ToggleButton disabled={true} icon />
  </>
)
