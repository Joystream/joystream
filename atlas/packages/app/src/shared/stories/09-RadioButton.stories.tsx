import React, { useState } from 'react'
import { RadioButton } from '../components'

export default {
  title: 'RadioButton',
  component: RadioButton,
}

export const Primary = () => {
  const [checked, setChecked] = useState(false)
  return <RadioButton checked={checked} onClick={() => setChecked(!checked)} />
}

export const SelectedDisabled = () => <RadioButton checked disabled />

export const UnselectedDisabled = () => <RadioButton disabled />
export const Error = () => {
  const [checked, setChecked] = useState(false)
  return <RadioButton error checked={checked} onClick={() => setChecked(!checked)} />
}

export const WithLabel = () => {
  const [checked, setChecked] = useState(false)
  return <RadioButton label="Label" checked={checked} onClick={() => setChecked(!checked)} />
}

export const WithLabelStart = () => {
  const [checked, setChecked] = useState(false)
  return <RadioButton label="Label" position="start" checked={checked} onClick={() => setChecked(!checked)} />
}

export const WithLabelBottom = () => {
  const [checked, setChecked] = useState(false)
  return <RadioButton label="A longer label" position="bottom" checked={checked} onClick={() => setChecked(!checked)} />
}
export const WithLabelTop = () => {
  const [checked, setChecked] = useState(false)
  return <RadioButton label="A longer label" position="top" checked={checked} onClick={() => setChecked(!checked)} />
}
