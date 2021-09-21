/**
 * @param {import('express').RequestHandler} fn
 * @returns {import('express').RequestHandler}
 */
export function wrap (fn) {
  return (req, res, next) => {
    Promise.resolve()
      .then(() => fn(req, res, next))
      .catch(next)
  }
}
