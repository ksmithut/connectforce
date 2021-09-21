import React from 'react'

/** @type {React.Context<import('./connect-force-api').ConnectForceClient>} */
// @ts-ignore
const ClientContext = React.createContext(null)

/**
 * @param {React.PropsWithChildren<{ client: import('./connect-force-api').ConnectForceClient}>} param0
 */
export function ConnectForceProvider ({ client, children }) {
  return (
    <ClientContext.Provider value={client}>{children}</ClientContext.Provider>
  )
}

export function useConnectForceClient () {
  return React.useContext(ClientContext)
}

/**
 * @returns {[{ error: Error?, loading: boolean, code: string? }, () => void]}
 */
export function useCreateGame () {
  const client = useConnectForceClient()
  const [state, setState] = React.useState({
    /** @type {Error|null} */
    error: null,
    loading: false,
    /** @type {string|null} */
    code: null
  })
  const createGame = React.useCallback(() => {
    setState({ error: null, loading: true, code: null })
    client
      .createGame()
      .then(({ code }) => setState({ error: null, loading: false, code }))
      .catch(error => setState({ error, loading: false, code: null }))
  }, [client])
  return [state, createGame]
}

/**
 * @returns {[{ error: Error?, loading: boolean, code: string? }, (code: string) => void]}
 */
export function useJoinGame () {
  const client = useConnectForceClient()
  const [state, setState] = React.useState({
    /** @type {Error|null} */
    error: null,
    loading: false,
    /** @type {string|null} */
    code: null
  })
  const joinGame = React.useCallback(
    /**
     * @param {string} code
     */
    code => {
      setState({ error: null, loading: true, code: null })
      client
        .joinGame(code)
        .then(() => setState({ error: null, loading: false, code }))
        .catch(error => setState({ error, loading: false, code: null }))
    },
    []
  )
  return [state, joinGame]
}

/**
 * @param {object} params
 * @param {string} params.code
 * @param {number} params.version
 * @returns {[Error | null, { placeToken: (params: { column: number, row: number }) => void, rotateClockwise: () => void, rotateCounterclockwise: () => void }]}
 */
export function useGameActions ({ code, version }) {
  const client = useConnectForceClient()
  const [error, setError] = React.useState(/** @type {Error?} */ (null))
  const placeToken = React.useCallback(
    /**
     * @param {object} params
     * @param {number} params.column
     * @param {number} params.row
     */
    ({ column, row }) => {
      setError(null)
      client
        .placeToken(code, { column, row, version })
        .catch(error => setError(error))
    },
    [client, code, version]
  )
  const rotateClockwise = React.useCallback(() => {
    setError(null)
    client.rotateClockwise(code, { version }).catch(error => setError(error))
  }, [client, code, version])
  const rotateCounterclockwise = React.useCallback(() => {
    setError(null)
    client
      .rotateCounterclockwise(code, { version })
      .catch(error => setError(error))
  }, [client, code, version])
  return [error, { placeToken, rotateClockwise, rotateCounterclockwise }]
}

/**
 * @typedef {object} GameData
 * @property {string} playerId
 * @property {number} version
 * @property {import('./connect-force-api').Game} game
 */

/**
 * @param {string} code
 */
export function useGameData (code) {
  const client = useConnectForceClient()
  const [gameData, setGameData] = React.useState(
    /** @type {GameData|null} */ (null)
  )
  React.useEffect(() => client.watch(code, setGameData), [client, code])
  const playerIndex = gameData?.game.players.findIndex(
    playerId => playerId === gameData?.playerId
  )
  const isYourTurn = playerIndex === gameData?.game.current
  const finished = gameData?.game.state === 'finished'
  const inProgress = gameData?.game.state === 'in_progress'
  const waiting = gameData?.game.state === 'waiting'
  return {
    ...gameData,
    isYourTurn,
    finished,
    inProgress,
    waiting,
    playerIndex
  }
}

/**
 * @typedef {[number, number]} Coordinates
 */

/**
 * @param {import('./connect-force-api').Board} board
 * @returns {Set<string>}
 */
function findFinishedCells (board) {
  /** @type {Set<string>} */
  const cells = new Set()
  for (const [c, column] of board.entries()) {
    for (const [r, value] of column.entries()) {
      if (value === null) continue
      const [playerIndex] = value
      /** @type {Coordinates} */
      const current = [c, r]
      /** @type {Coordinates[]} */
      const up = [
        [c, r + 1],
        [c, r + 2],
        [c, r + 3]
      ]
      /** @type {Coordinates[]} */
      const upRight = [
        [c + 1, r + 1],
        [c + 2, r + 2],
        [c + 3, r + 3]
      ]
      /** @type {Coordinates[]} */
      const right = [
        [c + 1, r],
        [c + 2, r],
        [c + 3, r]
      ]
      /** @type {Coordinates[]} */
      const downRight = [
        [c + 1, r - 1],
        [c + 2, r - 2],
        [c + 3, r - 3]
      ]
      ;[up, upRight, right, downRight]
        .filter(coordinates =>
          coordinates.every(([c, r]) => board[c]?.[r]?.[0] === playerIndex)
        )
        .map(coordinates => [current, ...coordinates])
        .forEach(coordinates =>
          coordinates.forEach(([c, r]) => cells.add(`${c}:${r}`))
        )
    }
  }
  return cells
}
