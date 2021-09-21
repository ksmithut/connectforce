import migrateMongo from 'migrate-mongo'

const MIGRATIONS_DIR = new URL('../migrations/', import.meta.url).pathname

/**
 * @param {object} params
 * @param {string} params.mongoURL
 * @param {import('mongodb').MongoClientOptions} [params.mongoOptions]
 */
export function configureMigrateMongo ({ mongoURL, mongoOptions = {} }) {
  const databaseName = new URL(mongoURL).pathname.replace(/^\//, '')
  migrateMongo.config.set({
    mongodb: {
      url: mongoURL,
      options: mongoOptions,
      databaseName
    },
    migrationsDir: MIGRATIONS_DIR,
    // @ts-ignore
    migrationFileExtension: '.cjs',
    changelogCollectionName: 'changelog'
  })
  return migrateMongo
}
