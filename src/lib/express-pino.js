import crypto from 'node:crypto'

/** @type {WeakMap<import('express').Request, import('pino').Logger>} */
const loggerMap = new WeakMap()

/**
 * @param {import('pino').BaseLogger} baseLogger
 * @param {object} [config]
 * @param {string} [config.header='X-Request-Id']
 * @param {(req: import('express').Request) => string} [config.generateId]
 * @param {string} [config.key='req_id']
 * @param {string} [config.durationKey='ms']
 * @param {'trace' | 'debug' | 'info'} [config.level]
 * @returns {import('express').RequestHandler}
 */
export default function expressPino (
  baseLogger,
  {
    header = 'X-Request-Id',
    generateId = () => crypto.randomUUID(),
    key = 'id',
    durationKey = 'ms',
    level = 'trace'
  } = {}
) {
  return (req, res, next) => {
    const start = process.hrtime.bigint()
    const requestId = req.get(header) ?? generateId(req)
    res.set(header, requestId)
    const logger = baseLogger.child({ [key]: requestId })
    loggerMap.set(req, logger)
    function onFinish () {
      const end = process.hrtime.bigint()
      const ms = Number(end - start) / 1e6
      logger[level]({ req, res, [durationKey]: ms })
      res.off('finish', onFinish)
    }
    res.on('finish', onFinish)
    next()
  }
}

/**
 * @param {import('express').Request} req
 */
export function useLogger (req) {
  const logger = loggerMap.get(req)
  if (logger) return logger
  throw new ReferenceError('No logger found on request')
}
