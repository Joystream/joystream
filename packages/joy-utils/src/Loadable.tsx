import React from 'react'

export function Loadable<P extends Object>(required: string[], f: (props: P) => React.ReactNode): (props: P) => any {
	const loading = <div className="spinner"></div>
  
  return (props: P) => {
    if (!props) {
      return loading
    }

    for (let requirement of required) {
      if (!props.hasOwnProperty(requirement)) {
        return loading
      }
    }
    return f(props)
  }
}


