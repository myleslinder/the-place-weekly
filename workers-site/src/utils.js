export function parseCookies(cookiesHeader) {
  return cookiesHeader
    .split(';')
    .map(cookie => cookie.split('='))
    .reduce((obj, cookie) => {
      obj[cookie[0].trim()] = cookie[1]
      return obj
    }, {})
}
