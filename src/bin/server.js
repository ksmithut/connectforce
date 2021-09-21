import process from 'node:process'
import 'dotenv/config'
import { Command } from 'commander'
import { configureApp } from '../index.js'
import { getConfig } from '../config.js'

const program = new Command()

program
  .command('start', { isDefault: true })
  .description('Starts the server')
  .option('-m, --migrate', 'Run migrations before starting', false)
  .action(async ({ migrate }) => {
    const app = configureApp(getConfig(process.env))
    if (migrate) await app.migrateUp()
    const close = await app.start()
    function shutdown () {
      close()
        .then(() => process.exit())
        .catch(err => {
          console.error(err)
          process.exit(1)
        })
    }
    process.on('SIGINT', shutdown)
    process.on('SIGTERM', shutdown)
    process.on('SIGUSR2', shutdown)
  })

program
  .command('migrate:up')
  .description('Run migrations')
  .action(async () => {
    const app = configureApp(getConfig(process.env))
    await app.migrateUp()
  })

program
  .command('migrate:down')
  .description('Roll back the latest set of migrations')
  .action(async () => {
    const app = configureApp(getConfig(process.env))
    await app.migrateDown()
  })

program.parseAsync(process.argv)
