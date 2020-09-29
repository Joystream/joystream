import React from 'react'
import { Input } from './Searchbar.style'

type SearchbarProps = {
  value: string
} & React.DetailedHTMLProps<React.HTMLAttributes<HTMLInputElement>, HTMLInputElement>
const Searchbar: React.FC<SearchbarProps> = ({
  placeholder,
  onChange,
  onFocus,
  value,
  onBlur,
  onSubmit,
  ...hmtlProps
}) => {
  return (
    <Input
      value={value}
      placeholder={placeholder}
      type="search"
      onChange={onChange}
      onFocus={onFocus}
      onBlur={onBlur}
      onSubmit={onSubmit}
      {...hmtlProps}
    />
  )
}
export default Searchbar
