import { MongoClient } from 'mongodb'
import { timeout } from './lib/timeout.js'
import { once } from './lib/once.js'
import { configureMigrateMongo } from './utils/migrate-mongo.js'
import { configureLogger } from './utils/pino.js'
import { configSchema } from './config.js'
import { configureServer } from './server.js'

import { configurePubSub } from './services/pubsub/pubsub.mongo.js'
import { configureGameModel } from './services/game/game.mongo.js'
import { configureGameService } from './services/game/game.service.js'

/**
 * @param {import('./config').Config} config
 */
export function configureApp (config) {
  const { port, name, logLevel, mongoURL, cookieSecrets } = configSchema.parse(
    config
  )
  const logger = configureLogger({ name, logLevel })

  async function start () {
    const mongoClient = await MongoClient.connect(mongoURL)
    const mongoDb = mongoClient.db()

    const pubSub = configurePubSub(mongoDb)
    const gameModel = configureGameModel(mongoClient, mongoDb)
    const gameService = configureGameService({ pubSub, gameModel })
    const startServer = configureServer({ logger, cookieSecrets, gameService })

    const closeGameService = await gameService.start()
    const closeServer = await startServer(port)

    return once(async () => {
      await closeGameService()
      await timeout(closeServer(), 5000)
      await mongoClient.close()
    })
  }

  async function migrateUp () {
    const migrate = configureMigrateMongo({ mongoURL })
    const { db, client } = await migrate.database.connect()
    // @ts-ignore
    const files = await migrate.up(db, client).finally(() => client.close())
    logger.info({ files }, `${files.length} migrations run`)
  }

  async function migrateDown () {
    const migrate = configureMigrateMongo({ mongoURL })
    const { db, client } = await migrate.database.connect()
    // @ts-ignore
    const files = await migrate.down(db, client).finally(() => client.close())
    logger.info({ files }, `${files.length} migrations rolled back`)
  }

  return {
    start,
    migrateUp,
    migrateDown
  }
}
