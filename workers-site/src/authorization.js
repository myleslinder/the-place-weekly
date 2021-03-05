import { createUpdateGroup } from './groups'

const authEndpoint = 'https://accounts.spotify.com/api/token'
const meEndpoint = 'https://api.spotify.com/v1/me'

let cached_access_token
export const getTokenForUser = async userId => {
  if (cached_access_token) {
    return cached_access_token
  }
  let access_token = await MYLES_TODOS.get(`${userId}:access_token`)
  if (!access_token) {
    let json = await handleRefreshAuth(userId)
    access_token = json.access_token
  }
  return access_token
}

export const handleInitialAuthorization = async code => {
  let paramsUrl = new URL(authEndpoint)
  paramsUrl.searchParams.append('grant_type', 'authorization_code')
  paramsUrl.searchParams.append('code', code)
  paramsUrl.searchParams.append(
    'redirect_uri',
    'https://the-place-weekly.m-l.workers.dev/auth',
  )
  paramsUrl.searchParams.append('client_id', SPOTIFY_CLIENT_ID)
  paramsUrl.searchParams.append('client_secret', SPOTIFY_CLIENT_SECRET)
  let res = await fetch(paramsUrl.toString(), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
  })
  let json = await res.json()

  let meRes = await fetch(meEndpoint, {
    headers: { Authorization: `Bearer ${json.access_token}` },
  })
  let spotifyUser = await meRes.json()
  await MYLES_TODOS.put(`user:${spotifyUser.id}`, JSON.stringify(spotifyUser))
  await MYLES_TODOS.put(
    `user:${spotifyUser.id}:refresh_token`,
    json.refresh_token,
  )
  cached_access_token = json.access_token
  await MYLES_TODOS.put(
    `user:${spotifyUser.id}:access_token`,
    json.access_token,
    {
      expirationTtl: json.expires_in,
    },
  )
  await createUpdateGroup('The Place Weekly', [spotifyUser.id])
  return new Response(null, {
    status: 301,
    headers: {
      Location: '/success.html',
      'Set-Cookie': `SpotifyUserId=${spotifyUser.id};Secure;HttpOnly`,
    },
  })
}

const handleRefreshAuth = async userId => {
  let paramsUrl = new URL(authEndpoint)
  paramsUrl.searchParams.append('grant_type', 'refresh_token')
  let refresh_token = await MYLES_TODOS.get(
    `user:${userId}:refresh_token`,
    'text',
  )

  paramsUrl.searchParams.append('refresh_token', refresh_token)
  let credentials = `${SPOTIFY_CLIENT_ID}:${SPOTIFY_CLIENT_SECRET}`
  let Authorization = `Basic ${btoa(credentials)}`
  let res = await fetch(paramsUrl.toString(), {
    method: 'POST',
    headers: {
      Authorization,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
  })
  let json = await res.json()
  if (json.refresh_token) {
    await MYLES_TODOS.put(`user:${userId}:refresh_token`, json.refresh_token)
  }
  await MYLES_TODOS.put(`user:${userId}:access_token`, json.access_token, {
    expirationTtl: json.expires_in,
  })
  return json
}
