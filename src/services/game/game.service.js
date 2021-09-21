import { randomInt } from 'node:crypto'
import {
  createGame,
  joinGame,
  placeToken,
  rotateClockwise,
  rotateCounterclockwise,
  GameError
} from './game.js'

const GAME_CHANNEL = 'games'
const GAME_CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ'

function generateGameCode (length = 4) {
  return new Array(length)
    .fill(null)
    .map(() => GAME_CODE_ALPHABET[randomInt(0, GAME_CODE_ALPHABET.length)])
    .join('')
}

/**
 * @typedef {object} GameDocument
 * @property {string} code
 * @property {import('./game.js').Game} game
 * @property {number} version
 * @property {Date} updatedAt
 */

/**
 * @typedef {object} GameModel
 * @property {(params: { code: string }) => Promise<GameDocument|null>} read
 * @property {(params: { code: string, version: number, game: import('./game.js').Game, clock: Date }) => Promise<GameDocument>} create
 * @property {(params: { code: string, version: number, game: import('./game.js').Game, clock: Date }) => Promise<GameDocument|null>} update
 */

/** @typedef {(gameData: { game: import('./game').Game, version: number }?) => void} GameChangeHandler */
/** @typedef {ReturnType<configureGameService>} GameService */

/**
 * @param {object} params
 * @param {GameModel} params.gameModel
 * @param {import('../pubsub/pubsub.mongo').PubSubService} params.pubSub
 */
export function configureGameService ({ gameModel, pubSub }) {
  /** @type {Map<string, Set<GameChangeHandler>>} */
  const gameListeners = new Map()
  return Object.freeze({
    /**
     * @param {object} params
     * @param {string} params.playerId
     * @param {Date} [params.clock]
     */
    async createGame ({ playerId, clock = new Date() }) {
      const code = generateGameCode()
      const game = createGame({ playerId })
      const gameDocument = await gameModel.create({
        code,
        version: 0,
        game,
        clock
      })
      await pubSub.publish({ channel: GAME_CHANNEL, data: gameDocument })
      return gameDocument
    },
    /**
     * @param {object} params
     * @param {string} params.code
     * @param {string} params.playerId
     * @param {Date} [params.clock]
     */
    async joinGame ({ code, playerId, clock = new Date() }) {
      const gameDocument = await gameModel.read({ code })
      if (!gameDocument) throw new GameNotFound(code)
      const game = joinGame(gameDocument.game, { playerId })
      if (game instanceof GameError) throw game
      const newGameDocument = await gameModel.update({
        code,
        version: 0,
        game,
        clock
      })
      if (!newGameDocument) throw new GameOutOfDate(code)
      await pubSub.publish({ channel: GAME_CHANNEL, data: newGameDocument })
      return newGameDocument
    },
    /**
     * @param {object} params
     * @param {string} params.code
     * @param {string} params.playerId
     * @param {number} params.version
     * @param {number} params.column
     * @param {number} params.row
     * @param {Date} [params.clock]
     */
    async placeToken ({
      code,
      playerId,
      version,
      column,
      row,
      clock = new Date()
    }) {
      const gameDocument = await gameModel.read({ code })
      if (!gameDocument) throw new GameNotFound(code)
      const game = placeToken(gameDocument.game, { playerId, column, row })
      if (game instanceof GameError) throw game
      const newGameDocument = await gameModel.update({
        code,
        version,
        game,
        clock
      })
      if (!newGameDocument) throw new GameOutOfDate(code)
      await pubSub.publish({ channel: GAME_CHANNEL, data: newGameDocument })
      return newGameDocument
    },
    /**
     * @param {object} params
     * @param {string} params.code
     * @param {string} params.playerId
     * @param {number} params.version
     * @param {Date} [params.clock]
     */
    async rotateClockwise ({ code, playerId, version, clock = new Date() }) {
      const gameDocument = await gameModel.read({ code })
      if (!gameDocument) throw new GameNotFound(code)
      const game = rotateClockwise(gameDocument.game, { playerId })
      if (game instanceof GameError) throw game
      const newGameDocument = await gameModel.update({
        code,
        version,
        game,
        clock
      })
      if (!newGameDocument) throw new GameOutOfDate(code)
      await pubSub.publish({ channel: GAME_CHANNEL, data: newGameDocument })
      return newGameDocument
    },
    /**
     * @param {object} params
     * @param {string} params.code
     * @param {string} params.playerId
     * @param {number} params.version
     * @param {Date} [params.clock]
     */
    async rotateCounterclockwise ({
      code,
      playerId,
      version,
      clock = new Date()
    }) {
      const gameDocument = await gameModel.read({ code })
      if (!gameDocument) throw new GameNotFound(code)
      const game = rotateCounterclockwise(gameDocument.game, { playerId })
      if (game instanceof GameError) throw game
      const newGameDocument = await gameModel.update({
        code,
        version,
        game,
        clock
      })
      if (!newGameDocument) throw new GameOutOfDate(code)
      await pubSub.publish({ channel: GAME_CHANNEL, data: newGameDocument })
      return newGameDocument
    },
    /**
     * @param {object} params
     * @param {string} params.code
     * @param {string} params.playerId
     * @param {GameChangeHandler} onChange
     */
    async watch ({ code, playerId }, onChange) {
      const gameDocument = await gameModel.read({ code })
      if (!gameDocument) return null
      if (!gameDocument.game.players.includes(playerId)) return null
      setTimeout(() => {
        onChange({ game: gameDocument.game, version: gameDocument.version })
      })
      const listeners = gameListeners.get(code) ?? new Set()
      gameListeners.set(code, listeners)
      listeners.add(onChange)
      return () => {
        listeners.delete(onChange)
        if (listeners.size === 0) gameListeners.delete(code)
      }
    },
    start () {
      return pubSub.subscribe({
        channel: GAME_CHANNEL,
        onMessage ({ data }) {
          const listeners = gameListeners.get(data.code)
          if (!listeners) return
          for (const listener of listeners) {
            listener({ game: data.game, version: data.version })
          }
        },
        onClose () {
          for (const listeners of gameListeners.values()) {
            for (const listener of listeners) listener(null)
          }
          gameListeners.clear()
        }
      })
    }
  })
}

export { GameError }

export class GameNotFound extends Error {
  /**
   * @param {string} code
   */
  constructor (code) {
    super(`Game Not Found: ${code}`)
    Error.captureStackTrace(this, this.constructor)
    this.code = 'GAME_NOT_FOUND'
    this.gameCode = code
  }
}

export class GameOutOfDate extends Error {
  /**
   * @param {string} code
   */
  constructor (code) {
    super(`Game Out Of Date: ${code}`)
    Error.captureStackTrace(this, this.constructor)
    this.code = 'GAME_OUT_OF_DATE'
    this.gameCode = code
  }
}
