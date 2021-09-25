import http from 'node:http'
import express from 'express'
import { httpListen } from './lib/http-listen.js'
import expressPino, { useLogger } from './lib/express-pino.js'
import expressCookie from './lib/express-cookie.js'

import { configureGameRouter } from './services/game/game.express.js'

const PUBLIC_DIR = new URL('../build/', import.meta.url).pathname
const INDEX_HTML = new URL('../build/index.html', import.meta.url).pathname

/**
 * @param {object} params
 * @param {import('pino').BaseLogger} params.logger
 * @param {string[]} params.cookieSecrets
 * @param {import('./services/game/game.service').GameService} params.gameService
 */
export function configureServer ({ logger, cookieSecrets, gameService }) {
  const app = express()

  app.disable('x-powered-by')
  app.use(expressPino(logger))
  app.use(
    expressCookie({
      secrets: cookieSecrets,
      options: req => ({
        httpOnly: true,
        path: '/',
        sameSite: 'strict',
        secure: req.protocol === 'https:'
      })
    })
  )

  app.use('/api/games', configureGameRouter({ gameService }))

  app.use(express.static(PUBLIC_DIR))
  app.get('/*', (req, res, next) => {
    req.accepts('html') ? res.sendFile(INDEX_HTML) : next()
  })

  app.use(errorHandler())

  /**
   * @param {number} port
   */
  return async port => {
    const server = http.createServer(app)
    const closeServer = await httpListen(server, port)
    logger.info(`Server started on port ${port}`)
    return async () => {
      await closeServer()
    }
  }
}

/**
 *
 * @returns {import('express').ErrorRequestHandler}
 */
function errorHandler () {
  return (err, req, res, next) => {
    const logger = useLogger(req)
    logger.info({ err, event: 'REQUEST_ERROR' })
    if (!res.headersSent) {
      res.status(500).json({ code: 'UNHANDLED_ERROR' })
    }
  }
}
