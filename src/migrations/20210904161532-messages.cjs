'use strict'

/**
 * @param {import('mongodb').Db} db
 * @param {import('mongodb').MongoClient} client
 */
exports.up = async function up (db, client) {
  await client.withSession(async session => {
    const messages = await db.createCollection('messages', {
      capped: true,
      size: 5242880,
      max: 1000,
      session
    })
    await messages.createIndexes(
      [{ key: { channel: 1, _id: 1 }, name: 'channel_index' }],
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
    await db.dropCollection('messages', { session })
  })
}
