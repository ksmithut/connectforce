/** @typedef {0|1} PlayerIndex */
/** @typedef {([PlayerIndex, number]|null)[][]} Board */
/** @typedef {'down'|'left'|'up'|'right'} Gravity */
/** @typedef {'init'|'waiting'|'in_progress'|'finished'} State */
/** @typedef {{ column: number, row: number }} Coordinates */
/**
 * @typedef {object} Game
 * @property {string[]} players
 * @property {Board} board
 * @property {PlayerIndex} current
 * @property {State} state
 * @property {Gravity} gravity
 * @property {number} turn
 */

const DOWN = 'down'
const LEFT = 'left'
const UP = 'up'
const RIGHT = 'right'

const INIT = 'init'
const WAITING = 'waiting'
const IN_PROGRESS = 'in_progress'
const FINISHED = 'finished'

const GAME_CREATED = 'GAME_CREATED'
const GAME_JOINED = 'GAME_JOINED'
const TOKEN_PLACED = 'TOKEN_PLACED'
const ROTATED_CLOCKWISE = 'ROTATED_CLOCKWISE'
const ROTATED_COUNTERCLOCKWISE = 'ROTATED_COUNTERCLOCKWISE'

/** @type {Map<Gravity, Gravity>} */
const CLOCKWISE = new Map([
  [DOWN, RIGHT],
  [RIGHT, UP],
  [UP, LEFT],
  [LEFT, DOWN]
])

/** @type {Map<Gravity, Gravity>} */
const COUNTERCLOCKWISE = new Map([
  [DOWN, LEFT],
  [LEFT, UP],
  [UP, RIGHT],
  [RIGHT, DOWN]
])

/** @type {Map<Gravity, (coordinates: Coordinates) => Coordinates>} */
const BELOW_RESOLVERS = new Map([
  [DOWN, ({ column, row }) => ({ column, row: row - 1 })],
  [LEFT, ({ column, row }) => ({ column: column - 1, row })],
  [UP, ({ column, row }) => ({ column, row: row + 1 })],
  [RIGHT, ({ column, row }) => ({ column: column + 1, row })]
])

/** @type {Map<Gravity, (board: Board) => Board>} */
const GRAVITY_RESOLVERS = new Map([
  [DOWN, resolveGravityDown],
  [RIGHT, resolveGravityRight],
  [UP, resolveGravityUp],
  [LEFT, resolveGravityLeft]
])

/**
 * @param {Board} board
 * @param {object} params
 * @param {Gravity} params.gravity
 * @param {number} params.column
 * @param {number} params.row
 */
function isValidPlacement (board, { gravity, column, row }) {
  if (board[column]?.[row] !== null) return false
  const below = mapGet(BELOW_RESOLVERS, gravity)({ column, row })
  if (board[below.column]?.[below.row] === null) return false
  return true
}

/**
 * @param {Board} board
 */
function isBoardFinished (board) {
  for (const [c, column] of board.entries()) {
    for (const [r, value] of column.entries()) {
      if (value === null) continue
      const [playerIndex] = value
      const up = [board[c][r + 1], board[c][r + 2], board[c][r + 3]]
      const upRight = [
        board[c + 1]?.[r + 1],
        board[c + 2]?.[r + 2],
        board[c + 3]?.[r + 3]
      ]
      const right = [board[c + 1]?.[r], board[c + 2]?.[r], board[c + 3]?.[r]]
      const downRight = [
        board[c + 1]?.[r - 1],
        board[c + 2]?.[r - 2],
        board[c + 3]?.[r - 3]
      ]
      const isFinished = [up, upRight, right, downRight].some(values =>
        values.every(value => value?.[0] === playerIndex)
      )
      if (isFinished) return true
    }
  }
}

/**
 * @param {Board} board
 * @param {0|1} playerIndex
 * @param {object} params
 * @param {number} params.turn
 * @param {number} params.column
 * @param {number} params.row
 * @returns {Board}
 */
function placeTokenOnBoard (board, playerIndex, params) {
  return board.map((column, columnIndex) =>
    column.map((existing, rowIndex) =>
      columnIndex === params.column && rowIndex === params.row
        ? [playerIndex, params.turn]
        : existing
    )
  )
}

/**
 * @param {Board} board
 * @returns {Board}
 */
function invertBoard (board) {
  return board[0].map((_value, index) => {
    return board.map(column => column[index])
  })
}

/**
 * @param {Board} board
 * @returns {Board}
 */
function resolveGravityDown (board) {
  return board.map(column => {
    const newColumn = column.filter(value => value !== null)
    return [
      ...newColumn,
      ...new Array(column.length - newColumn.length).fill(null)
    ]
  })
}

/**
 * @param {Board} board
 * @returns {Board}
 */
function resolveGravityLeft (board) {
  return invertBoard(resolveGravityDown(invertBoard(board)))
}

/**
 * @param {Board} board
 * @returns {Board}
 */
function resolveGravityUp (board) {
  return board.map(column => {
    const newColumn = column.filter(value => value !== null)
    return [
      ...new Array(column.length - newColumn.length).fill(null),
      ...newColumn
    ]
  })
}

/**
 * @param {Board} board
 * @returns {Board}
 */
function resolveGravityRight (board) {
  return invertBoard(resolveGravityUp(invertBoard(board)))
}

/**
 * @template TKey, TValue
 * @param {Map<TKey, TValue>} map
 * @param {TKey} key
 * @returns {TValue}
 */
function mapGet (map, key) {
  const value = map.get(key)
  if (value == null) throw new ReferenceError(`No key found: ${key}`)
  return value
}

/**
 * @typedef {object} GameCreated
 * @property {GAME_CREATED} type
 * @property {object} payload
 * @property {string} payload.playerId
 */
/**
 * @param {object} params
 * @param {string} params.playerId
 * @returns {GameCreated}
 */
function createGameCreated ({ playerId }) {
  return { type: GAME_CREATED, payload: { playerId } }
}
/**
 * @typedef {object} GameJoined
 * @property {GAME_JOINED} type
 * @property {object} payload
 * @property {string} payload.playerId
 */
/**
 * @param {object} params
 * @param {string} params.playerId
 * @returns {GameJoined}
 */
function createGameJoined ({ playerId }) {
  return { type: GAME_JOINED, payload: { playerId } }
}
/**
 * @typedef {object} TokenPlaced
 * @property {TOKEN_PLACED} type
 * @property {object} payload
 * @property {number} payload.column
 * @property {number} payload.row
 */
/**
 * @param {object} params
 * @param {number} params.column
 * @param {number} params.row
 * @returns {TokenPlaced}
 */
function createTokenPlaced ({ column, row }) {
  return { type: TOKEN_PLACED, payload: { column, row } }
}
/**
 * @typedef {object} RotatedClockwise
 * @property {ROTATED_CLOCKWISE} type
 * @property {object} payload
 */
/**
 * @returns {RotatedClockwise}
 */
function createRotatedClockwise () {
  return { type: ROTATED_CLOCKWISE, payload: {} }
}
/**
 * @typedef {object} RotatedCounterclockwise
 * @property {ROTATED_COUNTERCLOCKWISE} type
 * @property {object} payload
 */
/**
 * @returns {RotatedCounterclockwise}
 */
function createRotatedCounterclockwise () {
  return { type: ROTATED_COUNTERCLOCKWISE, payload: {} }
}
/** @typedef {GameCreated|GameJoined|TokenPlaced|RotatedClockwise|RotatedCounterclockwise} GameAction */

/**
 * @returns {Game}
 */
function initialState () {
  return {
    players: [],
    board: new Array(7).fill(null).map(() => new Array(7).fill(null)),
    current: 0,
    state: INIT,
    gravity: DOWN,
    turn: 0
  }
}

/**
 * @param {Game} game
 * @param {GameCreated} action
 * @returns {Game}
 */
function handleGameCreated (game, action) {
  return {
    ...game,
    players: [action.payload.playerId],
    state: WAITING
  }
}

/**
 * @param {Game} game
 * @param {GameJoined} action
 * @returns {Game}
 */
function handleGameJoined (game, action) {
  return {
    ...game,
    players: [game.players[0], action.payload.playerId],
    state: IN_PROGRESS
  }
}

/**
 * @param {Game} game
 * @param {TokenPlaced} action
 * @returns {Game}
 */
function handleTokenPlaced (game, action) {
  const board = placeTokenOnBoard(game.board, game.current, {
    turn: game.turn,
    column: action.payload.column,
    row: action.payload.row
  })
  const isFinished = isBoardFinished(board)
  return {
    ...game,
    board,
    current: game.current === 0 ? 1 : 0,
    state: isFinished ? FINISHED : game.state,
    turn: game.turn + 1
  }
}

/**
 * @param {Game} game
 * @param {RotatedClockwise} action
 * @returns {Game}
 */
function handleRotatedClockwise (game, action) {
  const gravity = mapGet(CLOCKWISE, game.gravity)
  const board = mapGet(GRAVITY_RESOLVERS, gravity)(game.board)
  const isFinished = isBoardFinished(board)
  return {
    ...game,
    board,
    current: game.current === 0 ? 1 : 0,
    state: isFinished ? FINISHED : game.state,
    gravity,
    turn: game.turn + 1
  }
}

/**
 * @param {Game} game
 * @param {RotatedCounterclockwise} action
 * @returns {Game}
 */
function handleRotatedCounterclockwise (game, action) {
  const gravity = mapGet(COUNTERCLOCKWISE, game.gravity)
  const board = mapGet(GRAVITY_RESOLVERS, gravity)(game.board)
  const isFinished = isBoardFinished(board)
  return {
    ...game,
    board,
    current: game.current === 0 ? 1 : 0,
    state: isFinished ? FINISHED : game.state,
    gravity,
    turn: game.turn + 1
  }
}

/**
 * @param {Game} game
 * @param {GameAction} action
 * @returns {Game}
 */
function reducer (game, action) {
  switch (action.type) {
    case GAME_CREATED:
      return handleGameCreated(game, action)
    case GAME_JOINED:
      return handleGameJoined(game, action)
    case TOKEN_PLACED:
      return handleTokenPlaced(game, action)
    case ROTATED_CLOCKWISE:
      return handleRotatedClockwise(game, action)
    case ROTATED_COUNTERCLOCKWISE:
      return handleRotatedCounterclockwise(game, action)
    default:
      return game
  }
}

/**
 * @param {object} params
 * @param {string} params.playerId
 * @returns {Game}
 */
export function createGame ({ playerId }) {
  const game = initialState()
  const action = createGameCreated({ playerId })
  return reducer(game, action)
}

/**
 * @param {Game} game
 * @param {object} params
 * @param {string} params.playerId
 * @returns {Game | GameError}
 */
export function joinGame (game, { playerId }) {
  if (game.state !== WAITING || game.players.length !== 1) return new GameFull()
  if (game.players.includes(playerId)) return new AlreadyJoined()
  const action = createGameJoined({ playerId })
  return reducer(game, action)
}

/**
 * @param {Game} game
 * @param {object} params
 * @param {string} params.playerId
 * @param {number} params.column
 * @param {number} params.row
 * @returns {Game | GameError}
 */
export function placeToken (game, { playerId, column, row }) {
  if (game.state !== IN_PROGRESS) return new NotInProgress()
  const currentPlayerId = game.players[game.current]
  if (currentPlayerId !== playerId) return new NotPlayersTurn()
  if (!isValidPlacement(game.board, { gravity: game.gravity, column, row })) {
    return new InvalidPlacement()
  }
  const action = createTokenPlaced({ column, row })
  return reducer(game, action)
}

/**
 * @param {Game} game
 * @param {object} params
 * @param {string} params.playerId
 * @returns {Game | GameError}
 */
export function rotateClockwise (game, { playerId }) {
  if (game.state !== IN_PROGRESS) return new NotInProgress()
  const currentPlayerId = game.players[game.current]
  if (currentPlayerId !== playerId) return new NotPlayersTurn()
  const action = createRotatedClockwise()
  return reducer(game, action)
}

/**
 * @param {Game} game
 * @param {object} params
 * @param {string} params.playerId
 * @returns {Game | GameError}
 */
export function rotateCounterclockwise (game, { playerId }) {
  if (game.state !== IN_PROGRESS) return new NotInProgress()
  const currentPlayerId = game.players[game.current]
  if (currentPlayerId !== playerId) return new NotPlayersTurn()
  const action = createRotatedCounterclockwise()
  return reducer(game, action)
}

export class GameError extends Error {
  /**
   * @param {string} message
   * @param {string} code
   */
  constructor (message, code) {
    super(message)
    Error.captureStackTrace(this, this.constructor)
    this.code = code
  }
}

export class GameFull extends GameError {
  constructor () {
    super('Game is full', 'GAME_FULL')
  }
}

export class AlreadyJoined extends GameError {
  constructor () {
    super('Player has already joined', 'ALREADY_JOINED')
  }
}

export class NotInProgress extends GameError {
  constructor () {
    super('Game is not in progress', 'NOT_IN_PROGRESS')
  }
}

export class NotPlayersTurn extends GameError {
  constructor () {
    super("It it not the player's turn", 'NOT_PLAYERS_TURN')
  }
}

export class InvalidPlacement extends GameError {
  constructor () {
    super('Invalid token placement', 'INVALID_PLACEMENT')
  }
}
