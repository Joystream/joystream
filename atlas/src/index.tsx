import React from 'react'
import ReactDOM from 'react-dom'
import * as Sentry from '@sentry/react'
import App from './App'
import './styles.css'
import { SENTRY_DNS } from './config/urls'

Sentry.init({ dsn: SENTRY_DNS })
ReactDOM.render(<App />, document.getElementById('root'))
