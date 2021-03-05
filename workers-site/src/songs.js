import { getTokenForUser } from './authorization'

export const saveSongsForUserWeekly = async userId => {
  const { items } = await getSongsForUser(userId)
  let validSongUris = items
    .filter(item => {
      let added = new Date(item.added_at)
      let sevenDaysAgo = new Date()
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
      return added > sevenDaysAgo
    })
    .map(({ track: { uri } }) => uri)
  await MYLES_TODOS.put(`user:${userId}:songs`, JSON.stringify(validSongUris))
  return validSongUris
}

const getSongsForUser = async userId => {
  const endpoint = 'https://api.spotify.com/v1/me/tracks?offset=0&limit=20'
  let access_token = await getTokenForUser(userId)
  let res = await fetch(endpoint, {
    headers: {
      Authorization: `Bearer ${access_token}`,
    },
  })
  return res.json()
}
