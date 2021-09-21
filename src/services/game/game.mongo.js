import { ObjectId } from 'mongodb'

/**
 * @param {import('mongodb').MongoClient} mongoClient
 * @param {import('mongodb').Db} mongoDb
 * @returns {import('./game.service').GameModel}
 */
export function configureGameModel (mongoClient, mongoDb) {
  /** @type {import('mongodb').Collection<import('./game.service').GameDocument>} */
  const gameCollection = mongoDb.collection('games')
  return Object.freeze({
    async read ({ code }) {
      const gameDocument = await gameCollection.findOne({ code })
      return gameDocument
    },
    async create ({ code, version, game, clock }) {
      const gameDocument = {
        _id: new ObjectId(),
        code,
        version,
        game,
        updatedAt: clock
      }
      await gameCollection.insertOne(gameDocument)
      return gameDocument
    },
    async update ({ code, version, game, clock }) {
      const result = await gameCollection.findOneAndUpdate(
        { code, version },
        { $set: { version: version + 1, game, updatedAt: clock } },
        { returnDocument: 'after' }
      )
      return result.value
    }
  })
}
