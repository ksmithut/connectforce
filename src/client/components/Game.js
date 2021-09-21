import React from 'react'
import styled from 'styled-components'
import { Link } from 'react-router-dom'
import { useGameData, useGameActions } from '../lib/connect-force-hooks.js'
import { findFinishedCells } from '../lib/connect-force-api.js'
import ErrorMessage from './ErrorMessage.js'

const gridSrc = new URL('./grid.svg', import.meta.url)

/**
 * @param {object} params
 * @param {string} params.code
 */
export default function Game ({ code }) {
  const {
    game,
    playerIndex,
    isYourTurn,
    inProgress,
    finished,
    waiting,
    version = 0
  } = useGameData(code)
  const [error, actions] = useGameActions({ code, version })
  const { placeToken, rotateClockwise, rotateCounterclockwise } = actions
  const handlePlaceToken = React.useCallback(
    coordinates => {
      inProgress && isYourTurn && placeToken(coordinates)
    },
    [placeToken, inProgress, isYourTurn]
  )
  const handleRotateClockwise = React.useCallback(() => {
    inProgress && rotateClockwise()
  }, [rotateClockwise, inProgress])
  const handleRotateCounterclockwise = React.useCallback(() => {
    inProgress && rotateCounterclockwise()
  }, [rotateClockwise, inProgress])
  if (!game) return <p>Loading...</p>

  return (
    <>
      <GameWrapper>
        <RotateButton onClick={handleRotateCounterclockwise}>⟲</RotateButton>
        <BoardFlex>
          <Board
            board={game.board}
            gravity={game.gravity}
            onClick={handlePlaceToken}
          />
        </BoardFlex>
        <RotateButton onClick={handleRotateClockwise}>⟳</RotateButton>
      </GameWrapper>
      {inProgress && (
        <>
          <Info>
            You are{' '}
            <Player
              color={playerIndex === 0 ? PLAYER_1_COLOR : PLAYER_2_COLOR}
            />
          </Info>
          {isYourTurn && <Info>It is your turn</Info>}
        </>
      )}
      {finished && <BackHomeLink to='/'>Back Home</BackHomeLink>}
      {waiting && <GameCode>{code}</GameCode>}

      {error && <ErrorMessage>{error.message}</ErrorMessage>}
    </>
  )
}

const BackHomeLink = styled(Link)`
  text-decoration: none;
  font-size: 2rem;
  text-align: center;
  display: block;
  color: #11e;
`

const Info = styled.p`
  text-align: center;
  font-size: 2rem;
  margin: 0.5rem 0;
`

const GameCode = styled.pre`
  box-sizing: border-box;
  background-color: #111;
  position: absolute;
  top: 2rem;
  left: 50%;
  margin-left: -100px;
  width: 200px;
  font-size: 2rem;
  padding: 1rem;
  border-radius: 1rem;
  color: #eee;
  text-align: center;
`

const GameWrapper = styled.div`
  display: flex;
  width: 100%;
  max-width: 700px;
  max-height: 100%;
`

const BoardFlex = styled.div`
  flex-grow: 1;
  max-height: 100%;
`

const RotateButton = styled.button`
  box-sizing: border-box;
  padding: 16px;
  width: 16px;
  font-size: 48px;
  font-weight: bold;
  z-index: 2;
  border-radius: 16px;
  border: 4px solid #222;
  color: #222;
  background-color: #ddd;
  cursor: pointer;
  display: flex;
  justify-content: center;
  align-items: center;

  @media (min-width: 512px) {
    width: 64px;
    font-size: 48px;
  }
`

const PLAYER_1_COLOR = '#E22900'
const PLAYER_2_COLOR = '#EDD500'

/**
 * @param {null | [0|1, number]} cell
 */
function getColor (cell) {
  if (!cell) return 'rgb(0, 0, 0, 0)'
  return cell[0] === 0 ? PLAYER_1_COLOR : PLAYER_2_COLOR
}

/**
 * @param {object} props
 * @param {import('../lib/connect-force-api').Board} props.board
 * @param {import('../lib/connect-force-api').Gravity} props.gravity
 * @param {(pos: { column: number, row: number }) => void} props.onClick
 */
function Board ({ board, gravity, onClick }) {
  const rotation = useRotation(gravity)
  /** @type {Set<string>} */
  const finishedCells = findFinishedCells(board)
  console.log(finishedCells)
  const [tokens, emptyCells] = board.reduce(
    /**
     * @param {[React.ReactElement[], React.ReactElement[]]} acc
     * @param {(null|[0|1, number])[]} column
     * @param {number} columnIndex
     * @returns {[React.ReactElement[], React.ReactElement[]]}
     */
    (acc, column, columnIndex) => {
      return column.reduce(([tokens, emptyCells], cell, rowIndex) => {
        function handleClick () {
          const coordinates = translateCoordinates(board, gravity, {
            column: columnIndex,
            row: rowIndex
          })
          if (coordinates) onClick(coordinates)
        }
        const columnKey = `${columnIndex}:${rowIndex}`
        const winning = finishedCells.has(columnKey)
        const key = cell ? cell[1] : columnKey
        const element = (
          <Cell
            key={key}
            color={getColor(cell)}
            column={columnIndex}
            winning={winning}
            row={rowIndex}
            onClick={handleClick}
          />
        )
        return cell
          ? [tokens.concat(element), emptyCells]
          : [tokens, emptyCells.concat(element)]
      }, acc)
    },
    [[], []]
  )
  tokens.sort((a, b) => {
    if (Number(a.key) < Number(b.key)) return -1
    if (Number(a.key) > Number(b.key)) return 1
    return 0
  })

  return (
    <BoardWrapper rotation={rotation}>
      <GridImg src={gridSrc} alt='connect four grid' />
      <>{tokens}</>
      <>{emptyCells}</>
    </BoardWrapper>
  )
}

/**
 * @param {import('../lib/connect-force-api').Board} board
 * @param {import('../lib/connect-force-api').Gravity} gravity
 * @param {object} params
 * @param {number} params.column
 * @param {number} params.row
 * @returns {{ column: number, row: number }?}
 */
function translateCoordinates (board, gravity, { column, row }) {
  if (gravity === 'down') {
    for (const [index, value] of board[column].entries()) {
      if (value === null) return { column, row: index }
    }
    return null
  }
  if (gravity === 'up') {
    for (const [index, value] of [...board[column].entries()].reverse()) {
      if (value === null) return { column, row: index }
    }
    return null
  }
  if (gravity === 'left') {
    for (const [index, column] of board.entries()) {
      if (column[row] === null) return { column: index, row }
    }
    return null
  }
  if (gravity === 'right') {
    for (const [index, column] of [...board.entries()].reverse()) {
      if (column[row] === null) return { column: index, row }
    }
    return null
  }
  return null
}

const initialRotation = {
  down: 0,
  right: 90,
  up: 180,
  left: 270
}

/**
 * @param {import('../lib/connect-force-api').Gravity} gravity
 */
function useRotation (gravity) {
  const [rotation, setRotation] = React.useState(initialRotation[gravity])
  const [prevGravity, setPrevGravity] = React.useState(gravity)
  React.useEffect(() => {
    if (prevGravity === gravity) return
    switch (`${prevGravity}:${gravity}`) {
      case 'down:right':
      case 'right:up':
      case 'up:left':
      case 'left:down':
        setRotation(r => r + 90)
        break
      case 'down:left':
      case 'left:up':
      case 'up:right':
      case 'right:down':
        setRotation(r => r - 90)
        break
      case 'down:up':
      case 'up:down':
      case 'left:right':
      case 'right:left':
        setRotation(r => r + 180)
        break
    }
    setPrevGravity(gravity)
  }, [prevGravity, gravity])
  return rotation
}

const CELL_SIZE = 76 / 7
const CELL_GAP = 3

const Cell = styled.div`
  box-sizing: border-box;
  position: absolute;
  width: ${CELL_SIZE}%;
  height: ${CELL_SIZE}%;
  left: ${p => p.column * (CELL_SIZE + CELL_GAP) + CELL_GAP}%;
  bottom: ${p => p.row * (CELL_SIZE + CELL_GAP) + CELL_GAP}%;
  border-radius: 50%;
  border: ${p => (p.winning ? '0.4rem solid #000' : '0')};
  background-color: ${p => p.color};
  transition-property: top left;
  transition-delay: 0.2s;
  transition-duration: 0.4s;
  transition-timing-function: cubic-bezier(0.47, 0.03, 0.92, 0.71);
`

const Player = styled.div`
  display: inline-block;
  width: 1em;
  height: 1em;
  border-radius: 50%;
  background-color: ${p => p.color};
  position: relative;
  top: 0.2em;
`

const BoardWrapper = styled.div`
  box-sizing: border-box;
  position: relative;
  width: 100%;
  padding-bottom: 100%;
  transform: rotate(${p => p.rotation}deg);
  transition: transform 0.5s ease-in-out;
  cursor: pointer;
`

const GridImg = styled.img`
  width: 100%;
  height: 100%;
  position: absolute;
  pointer-events: none;
  z-index: 1;
`
