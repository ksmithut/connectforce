/**
 *
 * @param {Date} date
 * @param {number} amount
 * @param {'milliseconds'|'seconds'|'minutes'|'hours'|'days'|'weeks'|'months'|'years'} unit
 */
export function add (date, amount, unit) {
  const newDate = new Date(date)
  switch (unit) {
    case 'milliseconds':
      newDate.setMilliseconds(newDate.getMilliseconds() + amount)
      break
    case 'seconds':
      newDate.setSeconds(newDate.getSeconds() + amount)
      break
    case 'minutes':
      newDate.setMinutes(newDate.getMinutes() + amount)
      break
    case 'hours':
      newDate.setHours(newDate.getHours() + amount)
      break
    case 'days':
      newDate.setDate(newDate.getDate() + amount)
      break
    case 'weeks':
      newDate.setDate(newDate.getDate() + amount * 7)
      break
    case 'months':
      newDate.setMonth(newDate.getMonth() + amount)
      break
    case 'years':
      newDate.setFullYear(newDate.getFullYear() + amount)
      break
    default:
      throw new Error(`Unsupported time unit: ${unit}`)
  }
  return newDate
}
