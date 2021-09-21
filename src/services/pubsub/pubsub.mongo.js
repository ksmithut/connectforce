import { ObjectId } from 'mongodb'

/**
 * @typedef {object} MessageDocument
 * @property {string} id
 * @property {string} channel
 * @property {any} data
 */

/**
 * @typedef {ReturnType<configurePubSub>} PubSubService
 */

/**
 * @param {import('mongodb').Db} mongoDb
 */
export function configurePubSub (mongoDb) {
  const messagesCollection = mongoDb.collection('messages')
  return Object.freeze({
    /**
     * @param {object} params
     * @param {string} params.channel
     * @param {object} params.data
     */
    async publish ({ channel, data }) {
      const id = new ObjectId()
      await messagesCollection.insertOne({ _id: id, channel, data })
      return id.toHexString()
    },
    /**
     * @param {object} params
     * @param {string} params.channel
     * @param {string} [params.lastId]
     * @param {(message: MessageDocument) => void} params.onMessage
     * @param {() => void} params.onClose
     */
    async subscribe ({
      channel,
      lastId = new ObjectId().toHexString(),
      onMessage,
      onClose
    }) {
      const cursor = messagesCollection.find(
        { channel, _id: { $gt: new ObjectId(lastId) } },
        { tailable: true, awaitData: true }
      )
      cursor.on('close', () => onClose())
      cursor
        .forEach(doc => {
          if (!doc.data) return
          onMessage({
            channel: doc.channel,
            data: doc.data,
            id: doc._id.toHexString()
          })
        })
        .then(() => close())
        .catch(async error => {
          if (error.message === 'server is closed') return
          return close()
        })
      async function close () {
        if (!cursor.closed) await cursor.close()
      }
      return close
    }
  })
}
