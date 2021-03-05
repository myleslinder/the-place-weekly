import {
  getAssetFromKV,
  NotFoundError,
  MethodNotAllowedError,
} from '@cloudflare/kv-asset-handler'

import { handleLoginRedirect } from './src/login'
import { handleInitialAuthorization } from './src/authorization'
import { parseCookies } from './src/utils'
import { createUpdateGroup, updateGroupsPlaylists } from './src/groups'
// import Router from './router'

// need to get the static assets set up for page gen
// need pages for create group, join group
// need to set up the chron to run weekly for the playlists

addEventListener('scheduled', event => {
  event.waitUntil(updateGroupsPlaylists('The Place Weekly'))
})

addEventListener('fetch', event => {
  event.respondWith(handleEvent(event))
})

async function handleEvent(event) {
  try {
    let url = new URL(event.request.url)
    switch (url.pathname) {
      case '/spotify-login': {
        return new Response(null)
        //return handleLoginRedirect()
      }
      case '/auth': {
        return new Response(null)
        return await handleInitialAuthorization(url.searchParams.get('code'))
      }
      case '/create-group': {
        return new Response(null)
        let cookies = parseCookies(event.request.headers.get('Cookie') || '')
        if (!cookies.SpotifyUserId) {
          return new Response('not allowed', { headers: { status: 401 } })
        }
        // need to post a group name in future
        await createUpdateGroup('The Place Weekly', [cookies.SpotifyUserId])
        return new Response(null)
      }
      case '/update-group': {
        return new Response(null)
        let cookies = parseCookies(event.request.headers.get('Cookie') || '')
        if (!cookies.SpotifyUserId) break
        await updateGroupsPlaylists('The Place Weekly')
        return new Response(null)
      }
      default: {
        return await getAssetFromKV(event, {
          cacheControl: {
            bypassCache: true,
          },
        })
      }
    }
  } catch (e) {
    if (e instanceof NotFoundError) {
      let notFoundResponse = await getAssetFromKV(event, {
        mapRequestToAsset: req =>
          new Request(`${new URL(req.url).origin}/404.html`, req),
      })
      return new Response(notFoundResponse.body, {
        ...notFoundResponse,
        status: 404,
      })
    }
    if (e instanceof MethodNotAllowedError) {
      return new Response('An unexpected error occurred', { status: 403 })
    } else {
      console.error(e)
      return new Response(e.message || e.toString(), { status: 500 })
    }
  }
}
