import React from 'react'
import { Switch, Route, Redirect } from 'react-router-dom'
import HomePage from './pages/HomePage.js'
import GamePage from './pages/GamePage.js'

export default function App () {
  return (
    <Switch>
      <Route path='/' exact>
        <HomePage />
      </Route>
      <Route path='/game/:code'>
        <GamePage />
      </Route>
      <Redirect to='/' />
    </Switch>
  )
}
