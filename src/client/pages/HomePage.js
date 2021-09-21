import React from 'react'
import styled from 'styled-components'
import CreateGame from '../components/CreateGame.js'
import JoinGame from '../components/JoinGame.js'

export default function HomePage () {
  return (
    <PageWrapper>
      <h1>Connect Force</h1>
      <ComponentWrapper>
        <CreateGame />
      </ComponentWrapper>
      <ComponentWrapper>
        <JoinGame />
      </ComponentWrapper>
    </PageWrapper>
  )
}

const PageWrapper = styled.div`
  box-sizing: border-box;
  display: flex;
  padding: 2rem;
  align-items: center;
  flex-direction: column;
`

const ComponentWrapper = styled.div`
  box-sizing: border-box;
  padding: 1rem 0;
  min-width: 300px;
`
