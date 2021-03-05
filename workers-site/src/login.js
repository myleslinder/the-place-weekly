const scopes = [
  'user-library-read',
  'playlist-modify-private',
  'ugc-image-upload',
]
const authEndpoint = 'https://accounts.spotify.com/authorize'

let url = new URL(authEndpoint)
url.searchParams.append('response_type', 'code')
url.searchParams.append('client_id', SPOTIFY_CLIENT_ID)
url.searchParams.append('scope', scopes.join(' '))
url.searchParams.append(
  'redirect_uri',
  'https://the-place-weekly.m-l.workers.dev/auth',
)
// replace with something using the https://developers.cloudflare.com/workers/runtime-apis/web-crypto ?
// url.searchParams.append('state', '12345')
// then store in KV with what key?

export const handleLoginRedirect = () => {
  return Response.redirect(url.toString(), 302)
}
