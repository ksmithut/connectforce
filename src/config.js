import { z } from 'zod'
import { logLevelSchema } from './utils/pino.js'

/** @typedef {z.infer<configSchema>} Config */

export const configSchema = z.object({
  port: z
    .number()
    .int()
    .min(1)
    .max(65535),
  name: z.string(),
  logLevel: logLevelSchema,
  mongoURL: z.string().url(),
  cookieSecrets: z.array(z.string()).min(1)
})

const envSchema = z
  .object({
    PORT: z.string(),
    LOG_NAME: z.string(),
    LOG_LEVEL: logLevelSchema,
    MONGO_URL: z.string().url(),
    COOKIE_SECRETS: z.string()
  })
  .transform(env =>
    configSchema.parse({
      port: Number.parseInt(env.PORT, 10),
      name: env.LOG_NAME,
      logLevel: env.LOG_LEVEL,
      mongoURL: env.MONGO_URL,
      cookieSecrets: env.COOKIE_SECRETS.split(' ')
    })
  )

/**
 * @param {NodeJS.ProcessEnv} env
 */
export function getConfig (env) {
  return envSchema.parse(env)
}
