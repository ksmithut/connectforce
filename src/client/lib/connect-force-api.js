/**
 * @typedef {ReturnType<createConnectForceClient>} ConnectForceClient
 */

/** @typedef {([0|1, number]|null)[][]} Board */
/** @typedef {'down'|'left'|'up'|'right'} Gravity */

/**
 * @typedef {object} Game
 * @property {string[]} players
 * @property {Board} board
 * @property {0|1} current
 * @property {'init'|'waiting'|'in_progress'|'finished'} state
 * @property {Gravity} gravity
 * @property {number} turn
 */

/**
 * @param {object} params
 * @param {string} params.origin
 * @param {typeof window.fetch} params.fetch
 * @param {typeof EventSource} params.EventSource
 */
export function createConnectForceClient ({ origin, fetch, EventSource }) {
  const url = new URL('/api/games/', origin)
  return {
    /**
     * @returns {Promise<{ code: string }>}
     */
    async createGame () {
      const input = new URL('.', url).href
      const res = await fetch(input, {
        method: 'POST',
        credentials: 'include'
      })
      if (res.status !== 201) {
        throw new GameClientError('Failed to create game', 'FAILED_GAME_CREATE')
      }
      const body = await res.json()
      return { code: body.code }
    },
    /**
     * @param {string} code
     */
    async joinGame (code) {
      const input = new URL(`${encodeURIComponent(code)}/join`, url).href
      const res = await fetch(input, {
        method: 'POST',
        credentials: 'include'
      })
      if (res.status !== 204) {
        const body = await res.json()
        throw new GameClientError(body.message, body.code)
      }
    },
    /**
     * @param {string} code
     * @param {object} params
     * @param {number} params.column
     * @param {number} params.row
     * @param {number} params.version
     */
    async placeToken (code, { column, row, version }) {
      const input = new URL(`${encodeURIComponent(code)}/tokens`, url).href
      const res = await fetch(input, {
        method: 'POST',
        credentials: 'include',
        headers: [['Content-Type', 'application/json']],
        body: JSON.stringify({ column, row, version })
      })
      if (res.status !== 204) {
        const body = await res.json()
        throw new GameClientError(body.message, body.code)
      }
    },
    /**
     * @param {string} code
     * @param {object} params
     * @param {number} params.version
     */
    async rotateClockwise (code, { version }) {
      const input = new URL(`${encodeURIComponent(code)}/clockwise`, url).href
      const res = await fetch(input, {
        method: 'POST',
        credentials: 'include',
        headers: [['Content-Type', 'application/json']],
        body: JSON.stringify({ version })
      })
      if (res.status !== 204) {
        const body = await res.json()
        throw new GameClientError(body.message, body.code)
      }
    },
    /**
     * @param {string} code
     * @param {object} params
     * @param {number} params.version
     */
    async rotateCounterclockwise (code, { version }) {
      const input = new URL(`${encodeURIComponent(code)}/counterclockwise`, url)
        .href
      const res = await fetch(input, {
        method: 'POST',
        credentials: 'include',
        headers: [['Content-Type', 'application/json']],
        body: JSON.stringify({ version })
      })
      if (res.status !== 204) {
        const body = await res.json()
        throw new GameClientError(body.message, body.code)
      }
    },
    /**
     * @param {string} code
     * @param {(data: { game: Game, version: number, playerId: string }) => void} onUpdate
     */
    watch (code, onUpdate) {
      const input = new URL(`${encodeURIComponent(code)}`, url)
      const eventSource = new EventSource(input, {
        withCredentials: true
      })
      /**
       * @param {MessageEvent} e
       */
      function handleUpdate (e) {
        onUpdate(JSON.parse(e.data))
      }
      // @ts-ignore
      eventSource.addEventListener('update', handleUpdate)
      return () => {
        // @ts-ignore
        eventSource.removeEventListener('update', handleUpdate)
        eventSource.close()
      }
    }
  }
}

class GameClientError extends Error {
  /**
   * @param {string} message
   * @param {string} code
   */
  constructor (message, code) {
    super(message)
    this.code = code
  }
}

/**
 * @typedef {[number, number]} Coordinates
 */

/**
 * @param {Board} board
 * @returns {Set<string>}
 */
export function findFinishedCells (board) {
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
