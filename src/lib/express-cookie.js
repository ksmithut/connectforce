import cookie from 'cookie'
import cookieSignature from 'cookie-signature'

/** @type {WeakMap<import('express').Request, Record<string, string|undefined>>} */
const cookieMap = new WeakMap()
/** @type {WeakMap<import('express').Request, string[]>} */
const secretsMap = new WeakMap()
/** @type {WeakMap<import('express').Request, import('cookie').CookieSerializeOptions>} */
const optionsMap = new WeakMap()

/**
 * @param {object} config
 * @param {string[]} config.secrets
 * @param {(req: import('express').Request) => import('cookie').CookieSerializeOptions} [config.options]
 * @returns {import('express').RequestHandler}
 */
export default function expressCookie ({ secrets, options = () => ({}) }) {
  if (secrets.length === 0) {
    throw new Error('You must have at least one secret')
  }
  return (req, res, next) => {
    secretsMap.set(req, secrets)
    optionsMap.set(req, options(req))
    cookieMap.set(req, cookie.parse(req.headers.cookie ?? ''))
    next()
  }
}

/**
 * @param {import('express').Request} req
 */
function getSecrets (req) {
  const secrets = secretsMap.get(req)
  if (secrets) return secrets
  throw new Error('You must initialize expressCookie()')
}

/**
 * @param {import('express').Request} req
 * @param {string} name
 */
export function getCookie (req, name) {
  const cookies = cookieMap.get(req) ?? {}
  return cookies[name] ?? null
}

/**
 * @param {import('express').Request} req
 * @param {string} name
 */
export function getSignedCookie (req, name) {
  const rawValue = getCookie(req, name)
  if (rawValue == null) return null
  for (const secret of getSecrets(req)) {
    const value = cookieSignature.unsign(rawValue, secret)
    if (value !== false) return value
  }
  return null
}

/**
 * @param {import('express').Request} req
 * @param {string} name
 * @param {string} value
 * @param {import('cookie').CookieSerializeOptions} [options]
 */
export function setCookie (req, name, value, options) {
  const header = req.res?.getHeader('set-cookie') ?? []
  const setCookie = Array.isArray(header) ? header.slice() : [String(header)]
  setCookie.push(
    cookie.serialize(name, value, {
      ...optionsMap.get(req),
      ...options
    })
  )
  req.res?.set('set-cookie', setCookie)
}

/**
 * @param {import('express').Request} req
 * @param {string} name
 * @param {string} value
 * @param {import('cookie').CookieSerializeOptions} [options]
 */
export function setSignedCookie (req, name, value, options) {
  const [secret] = getSecrets(req)
  setCookie(req, name, cookieSignature.sign(value, secret), options)
}

/**
 * @param {import('express').Request} req
 * @param {string} name
 */
export function clearCookie (req, name) {
  setCookie(req, name, '', { expires: new Date(0) })
}
