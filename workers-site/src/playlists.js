import { groupnameToKVName } from './groups'
import { getTokenForUser } from './authorization'
import playlistImage from './playlist-image'

export const getPlaylistsForGroup = async groupname => {
  let groupKVName = groupnameToKVName(groupname)
  let list = await MYLES_TODOS.list({ prefix: `${groupKVName}` })
  let playlistPromises = list.keys.map(({ name }) =>
    MYLES_TODOS.get(name, 'json'),
  )
  return Promise.all(playlistPromises)
}

export const createPlaylist = async (group, userId) => {
  let access_token = await getTokenForUser(userId)
  const endpoint = `https://api.spotify.com/v1/users/${userId}/playlists`
  let res = await fetch(endpoint, {
    method: 'POST',
    headers: { Authorization: `Bearer ${access_token}` },
    body: JSON.stringify({
      name: group.name,
      public: false,
      description: 'Liked music from the rest of the place - updated weekly.',
    }),
  })
  let { id } = await res.json()
  let playlist = { userId, id }
  await MYLES_TODOS.put(
    `${groupnameToKVName(group.name)}:${userId}:playlist`,
    JSON.stringify(playlist),
  )
  await setPlaylistImage(access_token, playlist.id)
  return playlist
}

const setPlaylistImage = async (access_token, playlistId) => {
  const endpoint = `https://api.spotify.com/v1/playlists/${playlistId}/images`
  await fetch(endpoint, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${access_token}`,
      'Content-Type': 'image/jpeg',
    },
    body: playlistImage,
  })
}

export const updatePlaylistForUser = async (userId, playlistId, songUris) => {
  const endpoint = new URL(
    `https://api.spotify.com/v1/playlists/${playlistId}/tracks`,
  )

  endpoint.searchParams.append('uris', songUris.join())

  let access_token = await getTokenForUser(userId)
  let res = await fetch(endpoint, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${access_token}`,
      'Content-Type': 'application/json',
    },
  })
  return res.json()
}
