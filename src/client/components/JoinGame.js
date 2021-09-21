import React from 'react'
import { Redirect } from 'react-router-dom'
import { Button } from 'reakit/Button'
import { Input } from 'reakit/Input'
import { Group } from 'reakit/Group'
import { useJoinGame } from '../lib/connect-force-hooks.js'
import ErrorMessage from './ErrorMessage.js'

export default function JoinGame () {
  const [state, joinGame] = useJoinGame()
  const [code, setCode] = React.useState('')
  const handleSubmit = React.useCallback(
    e => {
      e.preventDefault()
      if (state.loading) return
      if (code.length === 4) joinGame(code)
    },
    [code, state.loading]
  )
  const handleInputChange = React.useCallback(e => {
    setCode(e.target.value.toUpperCase())
    if (e.target.value.length === 4) {
      joinGame(e.target.value.toUpperCase())
    }
  }, [])
  if (state.code) {
    return <Redirect to={`/game/${encodeURIComponent(state.code)}`} />
  }
  return (
    <form onSubmit={handleSubmit}>
      <Group>
        <Input
          disabled={state.loading}
          onChange={handleInputChange}
          value={code}
          id='join-code'
          name='code'
          placeholder='Enter Code Here...'
          maxLength={4}
        />
        <Button disabled={state.loading} type='submit'>
          Join
        </Button>
      </Group>
      {state.error && <ErrorMessage>{state.error.message}</ErrorMessage>}
    </form>
  )
}
