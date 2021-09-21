'use strict'

/**
 * @param {import('mongodb').Db} db
 * @param {import('mongodb').MongoClient} client
 */
exports.up = async function up (db, client) {
  await client.withSession(async session => {})
}

/**
 * @param {import('mongodb').Db} db
 * @param {import('mongodb').MongoClient} client
 */
exports.down = async function down (db, client) {
  await client.withSession(async session => {})
}
