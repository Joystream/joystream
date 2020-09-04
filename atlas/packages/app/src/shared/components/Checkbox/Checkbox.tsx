import React from 'react'
import { CheckboxStyleProps, useCSS } from './Checkbox.style'
import Icon from '../Icon'

type CheckboxProps = {
  label?: string
  icon?: 'check' | 'dash'
  onChange?: (e: React.ChangeEvent) => void
} & CheckboxStyleProps

export default function Checkbox({
  label = '',
  disabled = false,
  error = false,
  selected = false,
  icon = 'check',
  labelPosition = 'end',
  onChange = () => {},
  ...styleProps
}: CheckboxProps) {
  const styles = useCSS({ ...styleProps, selected, error, disabled })
  return (
    <div css={styles.checkbox}>
      {(labelPosition === 'start' || labelPosition === 'top') && <label css={styles.label}>{label}</label>}
      <div css={styles.outerContainer}>
        <div css={styles.innerContainer}>
          <input css={styles.input} type="checkbox" checked={selected} disabled={disabled} onChange={onChange} />
          {selected && <Icon name={icon === 'check' ? 'check' : 'dash'} css={styles.icon} />}
        </div>
      </div>
      {(labelPosition === 'end' || labelPosition === 'bottom') && <label css={styles.label}>{label}</label>}
    </div>
  )
}
