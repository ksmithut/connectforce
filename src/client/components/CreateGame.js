import React from 'react'
import styled from 'styled-components'
import { Redirect } from 'react-router-dom'
import { Button } from 'reakit/Button'
import { useCreateGame } from '../lib/connect-force-hooks.js'
import ErrorMessage from './ErrorMessage.js'

export default function CreateGame () {
  const [state, createGame] = useCreateGame()
  const handleSubmit = React.useCallback(
    e => {
      e.preventDefault()
      if (!state.loading) createGame()
    },
    [createGame, state.loading]
  )
  if (state.code) {
    return <Redirect to={`/game/${encodeURIComponent(state.code)}`} />
  }
  return (
    <form onSubmit={handleSubmit}>
      <SubmitButton disabled={state.loading} type='submit'>
        Create Game
      </SubmitButton>
      {state.error && <ErrorMessage>{state.error.message}</ErrorMessage>}
    </form>
  )
}

const SubmitButton = styled(Button)`
  font-weight: bold !important;
  width: 100%;
`
