import process from 'node:process'
import 'dotenv/config'
import { Command } from 'commander'
import { getConfig } from '../config.js'
import { configureMigrateMongo } from '../utils/migrate-mongo.js'
import { configureLogger } from '../utils/pino.js'

const program = new Command()

program
  .argument('<name>')
  .description('Create a new migration file')
  .action(async migrationName => {
    const { name, logLevel, mongoURL } = getConfig(process.env)
    const logger = configureLogger({ name, logLevel, pretty: true })
    const migrateMongo = configureMigrateMongo({ mongoURL })
    const filepath = await migrateMongo.create(migrationName)
    logger.info(`Created migration file ${filepath}`)
  })

program.parseAsync(process.argv)
