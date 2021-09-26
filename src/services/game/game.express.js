import { randomUUID } from 'node:crypto'
import express from 'express'
import { z } from 'zod'
import * as dateUtils from '../../lib/date-utils.js'
import { wrap } from '../../lib/express-wrap.js'
import { getSignedCookie, setSignedCookie } from '../../lib/express-cookie.js'
import { GameError, GameNotFound, GameOutOfDate } from './game.service.js'

const COOKIE_NAME = 'cf.id'

/**
 * @param {object} params
 * @param {import('./game.service').GameService} params.gameService
 */
export function configureGameRouter ({ gameService }) {
  const router = express.Router()

  const createGame = wrap(async (req, res, next) => {
    const playerId = getPlayerId(req)
    const { code } = await gameService.createGame({ playerId })
    res.status(201).json({ code })
  })

  const joinGame = wrap(async (req, res, next) => {
    const code = req.params.code
    const playerId = getPlayerId(req)
    await gameService.joinGame({ code, playerId })
    res.sendStatus(204)
  })

  const placeTokenSchema = z.object({
    version: z.number(),
    column: z.number(),
    row: z.number()
  })
  const placeToken = wrap(async (req, res, next) => {
    const { version, column, row } = placeTokenSchema.parse(req.body)
    const code = req.params.code
    const playerId = getPlayerId(req)
    await gameService.placeToken({ code, playerId, version, column, row })
    res.sendStatus(204)
  })

  const rotateClockwiseSchema = z.object({
    version: z.number()
  })
  const rotateClockwise = wrap(async (req, res, next) => {
    const { version } = rotateClockwiseSchema.parse(req.body)
    const code = req.params.code
    const playerId = getPlayerId(req)
    await gameService.rotateClockwise({ code, playerId, version })
    res.sendStatus(204)
  })

  const rotateCounterclockwiseSchema = z.object({
    version: z.number()
  })
  const rotateCounterclockwise = wrap(async (req, res, next) => {
    const { version } = rotateCounterclockwiseSchema.parse(req.body)
    const code = req.params.code
    const playerId = getPlayerId(req)
    await gameService.rotateCounterclockwise({ code, playerId, version })
    res.sendStatus(204)
  })

  const watchGame = wrap(async (req, res, next) => {
    const code = req.params.code
    const playerId = getPlayerId(req)
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      Connection: 'keep-alive',
      'Cache-Control': 'no-cache'
    })
    res.write('\n')
    const close = await gameService.watch({ code, playerId }, event => {
      if (!event) {
        res.write(renderEvent({ event: 'done' }))
        res.end()
        return
      }
      const data = renderEvent({
        event: 'update',
        data: JSON.stringify({
          game: event.game,
          version: event.version,
          playerId
        })
      })
      res.write(data)
    })
    if (!close) {
      res.write(renderEvent({ event: 'done' }))
      res.end()
      return
    }
    const interval = setInterval(() => {
      res.write(renderEvent({ comment: 'keepalive' }))
    }, 15000)
    req.on('close', () => {
      close?.()
      clearInterval(interval)
    })
  })

  router.post('/', createGame)
  router.get('/:code', watchGame)
  router.post('/:code/join', joinGame)
  router.post('/:code/tokens', express.json(), placeToken)
  router.post('/:code/clockwise', express.json(), rotateClockwise)
  router.post('/:code/counterclockwise', express.json(), rotateCounterclockwise)
  router.use(errorHandler)

  return router
}

/**
 * @param {import('express').Request} req
 */
function getPlayerId (req) {
  const playerId = getSignedCookie(req, COOKIE_NAME) ?? randomUUID()
  setSignedCookie(req, COOKIE_NAME, playerId, {
    expires: dateUtils.add(new Date(), 1, 'weeks')
  })
  return playerId
}

/** @type {import('express').ErrorRequestHandler} */
function errorHandler (error, req, res, next) {
  if (
    error instanceof GameError ||
    error instanceof GameNotFound ||
    error instanceof GameOutOfDate
  ) {
    res.status(400).json({
      message: error.message,
      code: error.code
    })
    return
  }
  if (error instanceof z.ZodError) {
    res.status(400).json({
      message: error.message,
      code: 'INVALID_INPUT',
      details: error.errors
    })
    return
  }
  next(error)
}

/**
 * @param {string} string
 */
function cleanLine (string) {
  return string.replaceAll('\n', '').trim()
}

/**
 * @param {object} event
 * @param {string} [event.id]
 * @param {string} [event.event]
 * @param {number} [event.retry]
 * @param {string} [event.data]
 * @param {string} [event.comment]
 */
function renderEvent (event) {
  const lines = []
  if (event.id) lines.push(`id: ${cleanLine(event.id)}`)
  if (event.event) lines.push(`event: ${cleanLine(event.event)}`)
  if (event.retry != null) lines.push(`retry: ${event.retry}`)
  if (event.data) {
    lines.push(
      ...event.data.split('\n').map(data => `data: ${cleanLine(data)}`)
    )
  }
  if (event.comment) {
    lines.push(
      ...event.comment.split('\n').map(comment => `: ${cleanLine(comment)}`)
    )
  }
  lines.push('', '')
  return lines.join('\n')
}
