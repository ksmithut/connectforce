import React from 'react'
import { useParams } from 'react-router-dom'
import styled from 'styled-components'
import Game from '../components/Game.js'

export default function GamePage () {
  // @ts-ignore
  const { code } = useParams()
  return (
    <PageWrapper>
      <Game code={code} />
    </PageWrapper>
  )
}

const PageWrapper = styled.div`
  display: flex;
  align-items: center;
  flex-direction: column;
`
