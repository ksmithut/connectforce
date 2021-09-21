import React from 'react'
import ReactDOM from 'react-dom'
import { BrowserRouter } from 'react-router-dom'
import { Provider } from 'reakit'
import * as system from 'reakit-system-bootstrap'
import { createConnectForceClient } from './lib/connect-force-api.js'
import { ConnectForceProvider } from './lib/connect-force-hooks.js'
import App from './App.js'

const connectForceClient = createConnectForceClient({
  origin: window.location.origin,
  fetch: window.fetch,
  EventSource: window.EventSource
})

ReactDOM.render(
  <Provider unstable_system={system}>
    <ConnectForceProvider client={connectForceClient}>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </ConnectForceProvider>
  </Provider>,
  document.getElementById('root')
)
