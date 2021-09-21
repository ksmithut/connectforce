'use strict'

/**
 * @param {import('mongodb').Db} db
 * @param {import('mongodb').MongoClient} client
 */
exports.up = async function up (db, client) {
  await client.withSession(async session => {
    const games = await db.createCollection('games', {
      session
    })
    await games.createIndexes(
      [
        { key: { code: 1 }, name: 'unique_code', unique: true },
        { key: { updatedAt: 1 }, name: 'expires', expireAfterSeconds: 60 * 60 }
      ],
      { session }
    )
  })
}

/**
 * @param {import('mongodb').Db} db
 * @param {import('mongodb').MongoClient} client
 */
exports.down = async function down (db, client) {
  await client.withSession(async session => {
    await db.dropCollection('games', { session })
  })
}
